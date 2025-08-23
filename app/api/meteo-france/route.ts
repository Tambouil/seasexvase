import { NextRequest, NextResponse } from 'next/server';

const AROME_API_KEY_1 = process.env.AROME_API_KEY;
const AROME_API_KEY_2 = process.env.AROME_API_KEY_2;
const BASE_URL = 'https://public-api.meteofrance.fr/public/arome/1.0';

interface ForecastData {
  time: string;
  windSpeed: number;
  windGust: number;
  windDirection: number;
}

async function getLatestRunDate(): Promise<string> {
  const capabilitiesUrl = `${BASE_URL}/wcs/MF-NWP-HIGHRES-AROME-001-FRANCE-WCS/GetCapabilities?service=WCS&version=2.0.1`;
  const response = await fetch(capabilitiesUrl, {
    headers: { apikey: AROME_API_KEY_1! }
  });

  if (!response.ok) {
    throw new Error(`Capabilities failed: ${response.status}`);
  }

  const capabilitiesText = await response.text();
  const windSpeedMatches = capabilitiesText.match(
    /<wcs:CoverageId>WIND_SPEED__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND___([^<]*)<\/wcs:CoverageId>/g
  ) || [];

  const runDates = new Set<string>();
  windSpeedMatches.forEach((match) => {
    const dateMatch = match.match(/___(\d{4}-\d{2}-\d{2}T\d{2}\.\d{2}\.\d{2}Z)/);
    if (dateMatch) runDates.add(dateMatch[1]);
  });

  const sortedRunDates = Array.from(runDates).sort();
  const latestRunDate = sortedRunDates[sortedRunDates.length - 1];
  
  if (!latestRunDate) {
    throw new Error('No forecast runs found');
  }
  
  return latestRunDate;
}

async function fetchWindData(hour: number, runDate: string, lat: string, lon: string): Promise<ForecastData | null> {
  const runTime = new Date(runDate.replace(/\./g, ':'));
  const forecastTime = new Date(runTime);
  forecastTime.setHours(forecastTime.getHours() + hour);
  const forecastTimeStr = forecastTime.toISOString().replace(/\.\d{3}Z$/, 'Z');

  // Alternate API keys: token1 for even hours, token2 for odd hours  
  const hourIndex = Math.floor(hour / 3);
  const useToken2 = AROME_API_KEY_2 && (hourIndex % 2 === 1);
  const apiKey = useToken2 ? AROME_API_KEY_2 : AROME_API_KEY_1;
  const headers = { apikey: apiKey! };

  // Build URLs for the 4 required data types
  const baseParams = `service=WCS&version=2.0.1&subset=time(${forecastTimeStr})&subset=lat(${lat})&subset=long(${lon})&subset=height(10)&format=application/wmo-grib`;
  
  const urls = {
    windSpeed: `${BASE_URL}/wcs/MF-NWP-HIGHRES-AROME-001-FRANCE-WCS/GetCoverage?${baseParams}&coverageid=WIND_SPEED__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND___${runDate}`,
    windGust: `${BASE_URL}/wcs/MF-NWP-HIGHRES-AROME-001-FRANCE-WCS/GetCoverage?${baseParams}&coverageid=WIND_SPEED_GUST__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND___${runDate}`,
    windU: `${BASE_URL}/wcs/MF-NWP-HIGHRES-AROME-001-FRANCE-WCS/GetCoverage?${baseParams}&coverageid=U_COMPONENT_OF_WIND__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND___${runDate}`,
    windV: `${BASE_URL}/wcs/MF-NWP-HIGHRES-AROME-001-FRANCE-WCS/GetCoverage?${baseParams}&coverageid=V_COMPONENT_OF_WIND__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND___${runDate}`,
  };

  try {
    // Fetch all 4 data points in parallel
    const [windSpeedRes, windGustRes, windURes, windVRes] = await Promise.all([
      fetch(urls.windSpeed, { headers }),
      fetch(urls.windGust, { headers }),
      fetch(urls.windU, { headers }),
      fetch(urls.windV, { headers }),
    ]);

    let windSpeed = 0, windGust = 0, windDirection = 0;

    // Parse wind speed (required)
    if (windSpeedRes.ok) {
      const xml = await windSpeedRes.text();
      const match = xml.match(/<gml:tupleList>\s*([\d.]+)\s*<\/gml:tupleList>/);
      if (match) windSpeed = parseFloat(match[1]) * 3.6; // m/s to km/h
    }

    // Parse wind gust (optional, skip if 404 at hour 0)
    if (windGustRes.ok) {
      const xml = await windGustRes.text();
      const match = xml.match(/<gml:tupleList>\s*([\d.]+)\s*<\/gml:tupleList>/);
      if (match) windGust = parseFloat(match[1]) * 3.6;
    }

    // Parse wind direction from U/V components
    if (windURes.ok && windVRes.ok) {
      const [xmlU, xmlV] = await Promise.all([windURes.text(), windVRes.text()]);
      const matchU = xmlU.match(/<gml:tupleList>\s*([-\d.]+)\s*<\/gml:tupleList>/);
      const matchV = xmlV.match(/<gml:tupleList>\s*([-\d.]+)\s*<\/gml:tupleList>/);
      
      if (matchU && matchV) {
        const u = parseFloat(matchU[1]);
        const v = parseFloat(matchV[1]);
        windDirection = (270 - (Math.atan2(v, u) * 180) / Math.PI) % 360;
        if (windDirection < 0) windDirection += 360;
      }
    }

    // Return data if we got wind speed (minimum required)
    if (windSpeed > 0) {
      return {
        time: forecastTime.toISOString(),
        windSpeed,
        windGust: Math.max(windGust, windSpeed), // Gust can't be less than sustained wind
        windDirection,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching wind data for hour ${hour}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!AROME_API_KEY_1) {
      throw new Error('AROME_API_KEY is not configured');
    }

    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat') || '45.99';
    const lon = searchParams.get('lon') || '-1.1';

    console.log(`Fetching AROME forecasts for ${lat}, ${lon}...`);

    // Get the latest available run
    const latestRunDate = await getLatestRunDate();
    console.log(`Using run: ${latestRunDate}`);

    // Fetch forecast data every 3 hours up to 51 hours
    const forecasts: ForecastData[] = [];
    const promises: Promise<ForecastData | null>[] = [];

    // Create all requests (18 total: 0,3,6,9...51)
    for (let hour = 0; hour <= 51; hour += 3) {
      promises.push(fetchWindData(hour, latestRunDate, lat, lon));
    }

    // Wait for all requests with light delay between batches
    console.log('Executing forecast requests...');
    const results = await Promise.all(promises);
    
    // Filter out null results
    results.forEach((result) => {
      if (result) forecasts.push(result);
    });

    console.log(`Successfully retrieved ${forecasts.length}/18 forecast points`);

    return NextResponse.json({
      forecasts,
      debug: {
        message: 'AROME wind forecast data',
        latestRun: latestRunDate.replace(/\./g, ':'),
        forecastPoints: forecasts.length,
        expectedPoints: 18,
        usingBothKeys: !!AROME_API_KEY_2,
      },
    });

  } catch (error) {
    console.error('Error fetching Météo France data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Météo France data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}