import { NextRequest, NextResponse } from 'next/server';
import { fetchWeatherApi } from 'openmeteo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat') || '45.99';
    const lon = searchParams.get('lon') || '-1.1';

    const params = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      hourly: ['wind_speed_10m', 'wind_gusts_10m', 'wind_direction_10m'],
      models: 'arome_france_hd',
      forecast_days: 3,
      timezone: 'Europe/Paris',
      wind_speed_unit: 'kn',
    };

    const url = 'https://api.open-meteo.com/v1/meteofrance';
    const responses = await fetchWeatherApi(url, params);

    const response = responses[0];

    const latitude = response.latitude();
    const longitude = response.longitude();
    const elevation = response.elevation();
    const utcOffsetSeconds = response.utcOffsetSeconds();
    const hourly = response.hourly()!;

    // Return raw data from Open-Meteo API
    const weatherData = {
      latitude,
      longitude,
      elevation,
      utc_offset_seconds: utcOffsetSeconds,
      hourly: {
        time: [...Array((Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval())].map(
          (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
        ),
        wind_speed_10m: hourly.variables(0)!.valuesArray()!,
        wind_gusts_10m: hourly.variables(1)!.valuesArray()!,
        wind_direction_10m: hourly.variables(2)!.valuesArray()!,
      },
      hourly_units: {
        wind_speed_10m: 'kn',
        wind_gusts_10m: 'kn',
        wind_direction_10m: '°',
      },
    };

    console.log(`Successfully retrieved ${weatherData.hourly.time.length} hourly forecast points`);

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Error fetching Open-Meteo data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Open-Meteo data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
