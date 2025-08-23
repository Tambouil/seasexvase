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
      
      // Only analyze daylight hours (8h-21h) - extended for summer evening sessions
      const hour = forecastTime.getHours();
      if (hour < 8 || hour > 21) return;

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
        conditions += '+ Grande marée ';
      } else if (closestTide.height >= 2.5) {
        score += 20;
        conditions += '+ Marée suffisante ';
      }

      // Wind direction scoring (prefer offshore/side-shore winds)
      const windDir = forecast.windDirection;
      // For Fouras, good directions are roughly SW to NW (225-315°)
      if ((windDir >= 225 && windDir <= 315) || (windDir >= 45 && windDir <= 135)) {
        score += 20;
        conditions += '+ Direction favorable ';
      } else {
        score += 10;
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
        timeEnd: new Date(forecastTime.getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
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
    const bestSessions = sessions.filter(session => session.score >= 60);
    
    // Get next day's best session for notification
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('fr-FR');
    
    const tomorrowBest = sessions
      .filter(session => session.date === tomorrowStr)
      .sort((a, b) => b.score - a.score)[0];

    return NextResponse.json({
      allSessions: sessions.slice(0, 20), // Top 20 sessions
      bestSessions,
      tomorrowBest,
      analysis: {
        totalWindows: sessions.length,
        excellentSessions: sessions.filter(s => s.score >= 80).length,
        goodSessions: sessions.filter(s => s.score >= 60 && s.score < 80).length,
        averageSessions: sessions.filter(s => s.score >= 40 && s.score < 60).length,
      }
    });
  } catch (error) {
    console.error('Error analyzing sessions:', error);
    return NextResponse.json(
      { error: 'Failed to analyze session conditions' },
      { status: 500 }
    );
  }
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}