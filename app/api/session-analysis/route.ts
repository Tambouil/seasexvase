import { NextResponse } from 'next/server';

interface ForecastData {
  time: string;
  windSpeed: number;
  windGust: number;
  windDirection: number;
}

interface TideEvent {
  time: string;
  height: number;
  type: 'high' | 'low';
}

interface SessionWindow {
  date: string;
  timeStart: string;
  timeEnd: string;
  windSpeed: number;
  windDirection: string;
  tideHeight: number;
  score: number;
  conditions: string;
}

export async function GET() {
  try {
    // Fetch wind forecast
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000';
    const windUrl = `${baseUrl}/api/meteo-france?lat=45.99&lon=-1.1`;
    const windResponse = await fetch(windUrl);
    const windData = await windResponse.json();

    // Fetch tide data
    const tideUrl = `${baseUrl}/api/tides`;
    const tideResponse = await fetch(tideUrl);
    const tideData = await tideResponse.json();

    const forecasts: ForecastData[] = windData.forecasts || [];
    const tides: TideEvent[] = tideData.tideEvents || [];

    const sessions: SessionWindow[] = [];

    // Analyze each forecast hour
    forecasts.forEach((forecast) => {
      const forecastTime = new Date(forecast.time);

      // Dynamic daylight hours based on French timezone and seasons
      const hour = forecastTime.getHours();
      const month = forecastTime.getMonth() + 1; // 1-12

      // French timezone changes: last Sunday in March -> last Sunday in October
      const isDST = month >= 4 && month <= 9; // Approximation: April to September

      // Dynamic hours based on season and available daylight
      let startHour, endHour;
      if (month >= 5 && month <= 8) {
        // Summer (May-August): longer days, can navigate later
        startHour = 7;
        endHour = isDST ? 21 : 20;
      } else if ((month >= 3 && month <= 4) || (month >= 9 && month <= 10)) {
        // Spring/Autumn: moderate daylight
        startHour = 8;
        endHour = isDST ? 20 : 19;
      } else {
        // Winter (Nov-Feb): shorter days
        startHour = 9;
        endHour = 18;
      }

      if (hour < startHour || hour > endHour) return;

      // Skip if no tide data available
      if (!tides || tides.length === 0) return;

      // Find closest tide height
      let closestTide = tides[0];
      let minTimeDiff = Math.abs(new Date(tides[0].time).getTime() - forecastTime.getTime());

      tides.forEach((tide) => {
        const timeDiff = Math.abs(new Date(tide.time).getTime() - forecastTime.getTime());
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestTide = tide;
        }
      });

      // Convert wind speed to knots for analysis
      const windSpeedKnots = forecast.windSpeed / 1.852;

      // Skip sessions below minimum wind criteria (12 kts minimum)
      if (windSpeedKnots < 12) return;

      // Scoring criteria for windsurfing/sailing
      let score = 0;
      let conditions = '';

      // Wind speed scoring (based on sustained wind, not gusts)
      if (windSpeedKnots >= 20) {
        score += 40;
        conditions += 'Vent excellent ';
      } else if (windSpeedKnots >= 15 && windSpeedKnots < 20) {
        score += 30;
        conditions += 'Vent correct ';
      } else if (windSpeedKnots >= 12 && windSpeedKnots < 15) {
        score += 20;
        conditions += 'Vent moyen ';
      }

      // Skip if tide is too low for navigation (minimum 2.5m)
      if (closestTide.height < 2.5) return;

      // Tide height scoring
      if (closestTide.height >= 4.0) {
        score += 30;
        conditions += '+ Pleine eau ';
      } else if (closestTide.height >= 2.5) {
        score += 20;
        conditions += '+ Marée suffisante ';
      }

      // Wind direction scoring (prioritize regular sea winds over gusty land winds)
      const windDir = forecast.windDirection;

      if (windDir >= 225 && windDir <= 315) {
        // SW to NW: sea winds, regular and strong
        score += 20;
        conditions += '+ Vent à dominante Ouest ';
      } else if (windDir >= 45 && windDir <= 135) {
        // NE to SE: land winds, gusty but navigable
        score += 12;
        conditions += '+ Vent à dominante Est ';
      } else {
        // Other directions: less favorable
        score += 8;
        conditions += '+ Direction correcte ';
      }

      // Time of day bonus (afternoon preferred)
      if (hour >= 13 && hour <= 17) {
        score += 10;
        conditions += '+ Bon créneau ';
      }

      const windDirectionStr = getWindDirection(forecast.windDirection);

      sessions.push({
        date: forecastTime.toLocaleDateString('fr-FR'),
        timeStart: forecastTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        timeEnd: new Date(forecastTime.getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        windSpeed: Math.round(windSpeedKnots),
        windDirection: windDirectionStr,
        tideHeight: closestTide.height,
        score,
        conditions: conditions.trim(),
      });
    });

    // Sort by score (best conditions first)
    sessions.sort((a, b) => b.score - a.score);

    // Get best sessions (score >= 60)
    const bestSessions = sessions.filter((session) => session.score >= 60);

    // Get next day's best session for notification
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('fr-FR');

    const tomorrowBest = sessions
      .filter((session) => session.date === tomorrowStr)
      .sort((a, b) => b.score - a.score)[0];

    return NextResponse.json({
      allSessions: sessions.slice(0, 20), // Top 20 sessions
      bestSessions,
      tomorrowBest,
      analysis: {
        totalWindows: sessions.length,
        excellentSessions: sessions.filter((s) => s.score >= 80).length,
        goodSessions: sessions.filter((s) => s.score >= 60 && s.score < 80).length,
        averageSessions: sessions.filter((s) => s.score >= 40 && s.score < 60).length,
      },
    });
  } catch (error) {
    console.error('Error analyzing sessions:', error);
    return NextResponse.json({ error: 'Failed to analyze session conditions' }, { status: 500 });
  }
}

function getWindDirection(degrees: number): string {
  const directions = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSO',
    'SO',
    'OSO',
    'O',
    'ONO',
    'NO',
    'NNO',
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
