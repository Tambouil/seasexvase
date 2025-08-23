import { NextRequest, NextResponse } from 'next/server';

const AROME_API_KEY = process.env.AROME_API_KEY;
const AROME_API_KEY_2 = process.env.AROME_API_KEY_2;
const BASE_URL = 'https://public-api.meteofrance.fr/public/arome/1.0';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat') || '45.99';
  const lon = searchParams.get('lon') || '-1.1';

  try {
    if (!AROME_API_KEY) {
      throw new Error('AROME_API_KEY is not configured');
    }

    // Use second API key for half the requests to avoid rate limiting
    let requestCount = 0;

    // Step 1: Get capabilities to find available runs
    const capabilitiesUrl = `${BASE_URL}/wcs/MF-NWP-HIGHRES-AROME-001-FRANCE-WCS/GetCapabilities?service=WCS&version=2.0.1`;
    const capabilitiesResponse = await fetch(capabilitiesUrl, { 
      headers: { apikey: AROME_API_KEY }
    });

    if (!capabilitiesResponse.ok) {
      throw new Error(`Capabilities failed: ${capabilitiesResponse.status}`);
    }

    const capabilitiesText = await capabilitiesResponse.text();

    // Step 2: Find all wind speed coverages and extract unique run dates
    const windSpeedMatches =
      capabilitiesText.match(
        /<wcs:CoverageId>WIND_SPEED__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND___([^<]*)<\/wcs:CoverageId>/g
      ) || [];
    

    // Extract unique run dates (the date in the coverage ID is the run date, not forecast date!)
    const runDates = new Set<string>();
    windSpeedMatches.forEach((match) => {
      const dateMatch = match.match(/___(\d{4}-\d{2}-\d{2}T\d{2}\.\d{2}\.\d{2}Z)/);
      if (dateMatch) {
        runDates.add(dateMatch[1]);
      }
    });

    // Get the latest run date
    const sortedRunDates = Array.from(runDates).sort();
    const latestRunDate = sortedRunDates[sortedRunDates.length - 1];

    if (!latestRunDate) {
      throw new Error('No wind forecast runs found');
    }

    // Step 3: Generate forecast times for the latest run (AROME goes up to 51h)
    const forecasts = [];
    const runTime = new Date(latestRunDate.replace(/\./g, ':'));

    // AROME provides hourly forecasts up to 51 hours
    // For now, fetch every 3 hours to avoid rate limiting
    // TODO: Implement caching or better rate limit handling for hourly data
    for (let hour = 0; hour <= 51; hour += 3) {
      const forecastTime = new Date(runTime);
      forecastTime.setHours(forecastTime.getHours() + hour);

      try {
        // Construct the coverage ID with the RUN date (not forecast date)
        const windSpeedCoverageId = `WIND_SPEED__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND___${latestRunDate}`;
        const forecastTimeStr = forecastTime.toISOString().replace(/\.\d{3}Z$/, 'Z');

        // Get wind speed
        const windSpeedUrl =
          `${BASE_URL}/wcs/MF-NWP-HIGHRES-AROME-001-FRANCE-WCS/GetCoverage?` +
          `service=WCS&version=2.0.1&` +
          `coverageid=${windSpeedCoverageId}&` +
          `subset=time(${forecastTimeStr})&` +
          `subset=lat(${lat})&subset=long(${lon})&subset=height(10)&` +
          `format=application/wmo-grib`;

        // Get wind gust (if available)
        const windGustCoverageId = `WIND_SPEED_GUST__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND___${latestRunDate}`;
        const windGustUrl =
          `${BASE_URL}/wcs/MF-NWP-HIGHRES-AROME-001-FRANCE-WCS/GetCoverage?` +
          `service=WCS&version=2.0.1&` +
          `coverageid=${windGustCoverageId}&` +
          `subset=time(${forecastTimeStr})&` +
          `subset=lat(${lat})&subset=long(${lon})&subset=height(10)&` +
          `format=application/wmo-grib`;

        // Get wind U and V components to calculate direction
        const windUCoverageId = `U_COMPONENT_OF_WIND__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND___${latestRunDate}`;
        const windUUrl =
          `${BASE_URL}/wcs/MF-NWP-HIGHRES-AROME-001-FRANCE-WCS/GetCoverage?` +
          `service=WCS&version=2.0.1&` +
          `coverageid=${windUCoverageId}&` +
          `subset=time(${forecastTimeStr})&` +
          `subset=lat(${lat})&subset=long(${lon})&subset=height(10)&` +
          `format=application/wmo-grib`;

        const windVCoverageId = `V_COMPONENT_OF_WIND__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND___${latestRunDate}`;
        const windVUrl =
          `${BASE_URL}/wcs/MF-NWP-HIGHRES-AROME-001-FRANCE-WCS/GetCoverage?` +
          `service=WCS&version=2.0.1&` +
          `coverageid=${windVCoverageId}&` +
          `subset=time(${forecastTimeStr})&` +
          `subset=lat(${lat})&subset=long(${lon})&subset=height(10)&` +
          `format=application/wmo-grib`;

        // Alternate between API keys to avoid rate limiting
        const apiKey = AROME_API_KEY_2 && requestCount % 2 === 1 ? AROME_API_KEY_2 : AROME_API_KEY;
        requestCount++;
        
        const headers = { apikey: apiKey };

        const [windSpeedResponse, windGustResponse, windUResponse, windVResponse] = await Promise.all([
          fetch(windSpeedUrl, { headers }),
          fetch(windGustUrl, { headers }),
          fetch(windUUrl, { headers }),
          fetch(windVUrl, { headers }),
        ]);

        let windSpeed = 0;
        let windGust = 0;
        let windDirection = 0;

        if (windSpeedResponse.ok) {
          const windSpeedXml = await windSpeedResponse.text();
          const windSpeedMatch = windSpeedXml.match(/<gml:tupleList>\s*([\d.]+)\s*<\/gml:tupleList>/);
          if (windSpeedMatch) {
            windSpeed = parseFloat(windSpeedMatch[1]) * 3.6; // Convert m/s to km/h
          }
        }

        if (windGustResponse.ok) {
          const windGustXml = await windGustResponse.text();
          const windGustMatch = windGustXml.match(/<gml:tupleList>\s*([\d.]+)\s*<\/gml:tupleList>/);
          if (windGustMatch) {
            windGust = parseFloat(windGustMatch[1]) * 3.6; // Convert m/s to km/h
          }
        }

        // Calculate wind direction from U and V components
        let windU = 0;
        let windV = 0;
        
        if (windUResponse.ok) {
          const windUXml = await windUResponse.text();
          const windUMatch = windUXml.match(/<gml:tupleList>\s*([-\d.]+)\s*<\/gml:tupleList>/);
          if (windUMatch) {
            windU = parseFloat(windUMatch[1]);
          }
        }
        
        if (windVResponse.ok) {
          const windVXml = await windVResponse.text();
          const windVMatch = windVXml.match(/<gml:tupleList>\s*([-\d.]+)\s*<\/gml:tupleList>/);
          if (windVMatch) {
            windV = parseFloat(windVMatch[1]);
          }
        }
        
        // Calculate direction from U and V components
        if (windU !== 0 || windV !== 0) {
          windDirection = (270 - Math.atan2(windV, windU) * 180 / Math.PI) % 360;
          if (windDirection < 0) windDirection += 360;
        }

        // Only add if we got valid data
        if (windSpeed > 0) {
          forecasts.push({
            time: forecastTime.toISOString(),
            windSpeed: windSpeed,
            windGust: Math.max(windGust, windSpeed),
            windDirection: windDirection,
          });
        }
      } catch (error) {
        // Continue with next hour silently
      }
    }

    return NextResponse.json({
      forecasts,
      debug: {
        message: 'AROME wind forecast data',
        latestRun: latestRunDate.replace(/\./g, ':'),
        forecastPoints: forecasts.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch Météo France data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
