interface OpenMeteoData {
  latitude: number;
  longitude: number;
  elevation: number;
  utc_offset_seconds: number;
  hourly: {
    time: string[];
    wind_speed_10m: { [key: string]: number | null };
    wind_gusts_10m: { [key: string]: number | null };
    wind_direction_10m: { [key: string]: number | null };
  };
  hourly_units: {
    wind_speed_10m: string;
    wind_gusts_10m: string;
    wind_direction_10m: string;
  };
}

interface ForecastData {
  time: string;
  windSpeed: number;
  windGust: number;
  windDirection: number;
}

function getWindColorClass(speedKnots: number): string {
  // Speed in knots
  if (speedKnots < 7) return 'bg-blue-100 text-blue-900';
  if (speedKnots < 11) return 'bg-green-100 text-green-900';
  if (speedKnots < 16) return 'bg-yellow-100 text-yellow-900';
  if (speedKnots < 21) return 'bg-orange-100 text-orange-900';
  if (speedKnots < 27) return 'bg-red-100 text-red-900';
  if (speedKnots < 34) return 'bg-red-200 text-red-900';
  return 'bg-purple-100 text-purple-900';
}

function getWindGustColorClass(speedKnots: number): string {
  // Speed in knots
  if (speedKnots < 11) return 'bg-green-200 text-green-900';
  if (speedKnots < 16) return 'bg-yellow-200 text-yellow-900';
  if (speedKnots < 22) return 'bg-orange-200 text-orange-900';
  if (speedKnots < 27) return 'bg-red-200 text-red-900';
  if (speedKnots < 35) return 'bg-red-300 text-red-900';
  return 'bg-purple-200 text-purple-900';
}

function formatDirection(degrees: number): string {
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

async function getWeatherData(): Promise<ForecastData[]> {
  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
        : 'http://localhost:3000'
    }/api/open-meteo?lat=45.99&lon=-1.1`,
    {
      next: { revalidate: 3600 }, // Cache for 1 hour
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch forecast data');
  }

  const data: OpenMeteoData = await response.json();

  // Transform Open-Meteo data to our format
  const transformedForecasts: ForecastData[] = [];

  // Get data for every 1 hours
  for (let i = 0; i < data.hourly.time.length; i += 1) {
    const windSpeed = data.hourly.wind_speed_10m[i];
    const windGust = data.hourly.wind_gusts_10m[i];
    const windDirection = data.hourly.wind_direction_10m[i];

    // Skip if data is null
    if (windSpeed === null || windSpeed === undefined) continue;

    transformedForecasts.push({
      time: data.hourly.time[i],
      windSpeed: windSpeed,
      windGust: windGust || windSpeed,
      windDirection: windDirection || 0,
    });
  }

  return transformedForecasts;
}

export async function WindguruTable() {
  let forecasts: ForecastData[] = [];
  let error: string | null = null;

  try {
    forecasts = await getWeatherData();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600">Erreur: {error}</div>
      </div>
    );
  }

  // Group forecasts by day
  const forecastsByDay: { [key: string]: ForecastData[] } = {};
  forecasts.forEach((forecast) => {
    const date = new Date(forecast.time);
    const dayKey = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    if (!forecastsByDay[dayKey]) {
      forecastsByDay[dayKey] = [];
    }
    forecastsByDay[dayKey].push(forecast);
  });

  const days = Object.keys(forecastsByDay);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <h2 className="text-xl font-bold">AROME France HD 1.5 km - Fouras</h2>
        <p className="text-sm text-blue-100 mt-1">Prévisions Open-Meteo / Météo-France</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left px-2 py-1 sticky left-0 bg-white z-10 w-20">Init:</th>
              {days.map((day) => (
                <th
                  key={day}
                  colSpan={forecastsByDay[day].length}
                  className="text-center px-1 py-1 border-l border-gray-300 bg-gray-50"
                >
                  {day}
                </th>
              ))}
            </tr>
            <tr className="border-b border-gray-200">
              <th className="text-left px-2 py-1 sticky left-0 bg-white z-10"></th>
              {forecasts.map((forecast, i) => {
                const hour = new Date(forecast.time).getHours();
                return (
                  <th key={i} className="text-center px-1 py-1 text-xs font-normal">
                    {hour.toString().padStart(2, '0')}h
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="px-2 py-1 font-medium sticky left-0 bg-gray-50 z-10">Vent (kts)</td>
              {forecasts.map((forecast, i) => {
                const speedKnots = forecast.windSpeed;
                return (
                  <td key={i} className={`text-center px-1 py-2 text-xs font-bold ${getWindColorClass(speedKnots)}`}>
                    {Math.round(speedKnots)}
                  </td>
                );
              })}
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-2 py-1 font-medium sticky left-0 bg-gray-50 z-10">Rafales (kts)</td>
              {forecasts.map((forecast, i) => {
                const gustKnots = forecast.windGust;
                return (
                  <td key={i} className={`text-center px-1 py-2 text-xs font-bold ${getWindGustColorClass(gustKnots)}`}>
                    {Math.round(gustKnots)}
                  </td>
                );
              })}
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-2 py-1 font-medium sticky left-0 bg-gray-50 z-10">Direction</td>
              {forecasts.map((forecast, i) => (
                <td key={i} className="text-center px-1 py-2">
                  <div className="flex flex-col items-center">
                    <div
                      className="text-xs"
                      style={{
                        transform: `rotate(${forecast.windDirection}deg)`,
                        display: 'inline-block',
                      }}
                    >
                      ↓
                    </div>
                    <div className="text-xs text-gray-600">{formatDirection(forecast.windDirection)}</div>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-gray-50 border-t">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium">Échelle de vent (kts):</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded">0-6</span>
            <span className="px-2 py-1 bg-green-100 text-green-900 rounded">7-10</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-900 rounded">11-15</span>
            <span className="px-2 py-1 bg-orange-100 text-orange-900 rounded">16-20</span>
            <span className="px-2 py-1 bg-red-100 text-red-900 rounded">21-26</span>
            <span className="px-2 py-1 bg-red-200 text-red-900 rounded">27-33</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-900 rounded">34+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
