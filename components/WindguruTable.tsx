'use client';

import { useEffect, useState } from 'react';

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

function kmhToKnots(kmh: number): number {
  return kmh / 1.852;
}

function formatDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

export function WindguruTable() {
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runDate, setRunDate] = useState<string>('');

  useEffect(() => {
    async function fetchForecasts() {
      try {
        const response = await fetch('/api/meteo-france?lat=45.99&lon=-1.1');
        if (!response.ok) {
          throw new Error('Failed to fetch forecast data');
        }
        const data = await response.json();
        setForecasts(data.forecasts || []);
        if (data.debug?.latestRun) {
          setRunDate(data.debug.latestRun);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchForecasts();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
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
        <h2 className="text-xl font-bold">AROME 1.3 km - Fouras</h2>
        {runDate && (
          <p className="text-sm text-blue-100 mt-1">
            Modèle du {new Date(runDate).toLocaleDateString('fr-FR', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short', 
              hour: '2-digit',
              minute: '2-digit' 
            })} UTC
          </p>
        )}
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
                const speedKnots = kmhToKnots(forecast.windSpeed);
                return (
                  <td
                    key={i}
                    className={`text-center px-1 py-2 text-xs font-bold ${getWindColorClass(speedKnots)}`}
                  >
                    {Math.round(speedKnots)}
                  </td>
                );
              })}
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-2 py-1 font-medium sticky left-0 bg-gray-50 z-10">Rafales (kts)</td>
              {forecasts.map((forecast, i) => {
                const gustKnots = kmhToKnots(forecast.windGust);
                return (
                  <td
                    key={i}
                    className={`text-center px-1 py-2 text-xs font-bold ${getWindGustColorClass(gustKnots)}`}
                  >
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