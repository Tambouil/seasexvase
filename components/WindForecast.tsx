import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Navigation, TrendingUp, Wind } from 'lucide-react';

interface ForecastData {
  time: string;
  windSpeed: number;
  windGust: number;
  windDirection: number;
}


async function getWindForecast(): Promise<{ forecasts: ForecastData[]; error?: string }> {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
          : 'http://localhost:3000'
      }/api/meteo-france?lat=45.99&lon=-1.1`,
      {
        next: { revalidate: 3600 }, // Revalidate every hour
        cache: 'force-cache',
      }
    );

    if (!response.ok) {
      return { forecasts: [], error: 'Failed to fetch forecast data' };
    }

    const data = await response.json();
    return { forecasts: data.forecasts || [] };
  } catch (err) {
    return {
      forecasts: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function WindForecast() {
  const { forecasts, error } = await getWindForecast();

  const formatTime = (isoTime: string) => {
    return new Date(isoTime).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (isoTime: string) => {
    return new Date(isoTime).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getWindColorIntensity = (speedKmh: number) => {
    const speedKnots = speedKmh * 0.539957;
    if (speedKnots === 0) return 'bg-gray-100 text-gray-700 border-2 border-gray-400';
    if (speedKnots < 3) return 'bg-sky-300 text-sky-900';
    if (speedKnots < 5) return 'bg-sky-400 text-white';
    if (speedKnots < 8) return 'bg-blue-400 text-white';
    if (speedKnots < 12) return 'bg-blue-500 text-white';
    if (speedKnots < 15) return 'bg-emerald-400 text-white';
    if (speedKnots < 18) return 'bg-green-500 text-white';
    if (speedKnots < 22) return 'bg-green-600 text-white';
    if (speedKnots < 25) return 'bg-yellow-400 text-yellow-900';
    if (speedKnots < 28) return 'bg-amber-500 text-white';
    if (speedKnots < 32) return 'bg-orange-500 text-white';
    if (speedKnots < 35) return 'bg-red-500 text-white';
    if (speedKnots < 40) return 'bg-red-600 text-white';
    if (speedKnots < 45) return 'bg-red-700 text-white';
    if (speedKnots < 50) return 'bg-red-800 text-white';
    return 'bg-purple-600 text-white';
  };

  const getGustColorIntensity = (speedKmh: number) => {
    const speedKnots = speedKmh * 0.539957;
    if (speedKnots === 0) return 'bg-gray-100 text-gray-700 border-2 border-gray-400';
    if (speedKnots < 3) return 'bg-sky-300 text-sky-900';
    if (speedKnots < 5) return 'bg-sky-400 text-white';
    if (speedKnots < 8) return 'bg-blue-400 text-white';
    if (speedKnots < 12) return 'bg-blue-500 text-white';
    if (speedKnots < 15) return 'bg-emerald-400 text-white';
    if (speedKnots < 18) return 'bg-green-500 text-white';
    if (speedKnots < 22) return 'bg-green-600 text-white';
    if (speedKnots < 25) return 'bg-yellow-400 text-yellow-900';
    if (speedKnots < 28) return 'bg-amber-500 text-white';
    if (speedKnots < 32) return 'bg-orange-500 text-white';
    if (speedKnots < 35) return 'bg-red-500 text-white';
    if (speedKnots < 40) return 'bg-red-600 text-white';
    if (speedKnots < 45) return 'bg-red-700 text-white';
    if (speedKnots < 50) return 'bg-red-800 text-white';
    return 'bg-purple-600 text-white';
  };

  const formatDirection = (degrees: number): string => {
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
  };

  // Grouper les prévisions par jour
  const groupedForecasts = forecasts.reduce((acc, forecast) => {
    const date = new Date(forecast.time).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(forecast);
    return acc;
  }, {} as Record<string, ForecastData[]>);

  if (error) {
    return (
      <Card className="shadow-weather rounded-2xl border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <TrendingUp className="h-6 w-6" />
            Prévisions du vent
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Impossible de charger les prévisions: {error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!forecasts || forecasts.length === 0) {
    return (
      <Card className="shadow-weather rounded-2xl border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <TrendingUp className="h-6 w-6" />
            Prévisions du vent
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-900">Aucune prévision disponible</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-weather-strong rounded-2xl border-0">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold">
          <TrendingUp className="h-7 w-7" />
          Prévisions du vent - Météo France
        </CardTitle>
        <CardDescription className="text-indigo-200 text-base">
          Modèle AROME haute résolution - Plage de Fouras
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {Object.entries(groupedForecasts).map(([date, dayForecasts], dayIndex) => {
            const isToday = date === new Date().toDateString();
            const dayName = isToday ? "Aujourd'hui" : formatDate(dayForecasts[0].time);

            return (
              <div key={dayIndex} className="border-b border-slate-200 last:border-b-0">
                {/* En-tête du jour */}
                <div className="bg-slate-100 px-4 py-2 font-semibold text-slate-700">{dayName}</div>

                {/* Tableau horizontal des prévisions */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-xs">
                    {/* En-têtes */}
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-2 text-left font-medium text-slate-600 border-r border-slate-200 w-20">
                          Heure
                        </th>
                        {dayForecasts.map((forecast, index) => (
                          <th
                            key={index}
                            className="p-2 text-center font-medium text-slate-600 border-r border-slate-200 last:border-r-0 min-w-[50px] sm:min-w-[60px]"
                          >
                            {formatTime(forecast.time)}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {/* Vitesse du vent */}
                      <tr>
                        <td className="p-2 font-medium bg-slate-50 border-r border-slate-200 flex items-center gap-1">
                          <Wind className="h-3 w-3" />
                          <span className="hidden sm:inline">Vent</span>
                          <span className="sm:hidden">V</span>
                        </td>
                        {dayForecasts.map((forecast, index) => (
                          <td
                            key={index}
                            className={`p-2 font-bold text-center border-r border-slate-200 last:border-r-0 ${getWindColorIntensity(
                              forecast.windSpeed
                            )}`}
                          >
                            {(forecast.windSpeed * 0.539957).toFixed(0)}
                          </td>
                        ))}
                      </tr>

                      {/* Rafales */}
                      <tr>
                        <td className="p-2 font-medium bg-slate-50 border-r border-slate-200">
                          <span className="hidden sm:inline">Rafales</span>
                          <span className="sm:hidden">R</span>
                        </td>
                        {dayForecasts.map((forecast, index) => (
                          <td
                            key={index}
                            className={`p-2 font-bold text-center border-r border-slate-200 last:border-r-0 ${getGustColorIntensity(
                              forecast.windGust
                            )}`}
                          >
                            {(forecast.windGust * 0.539957).toFixed(0)}
                          </td>
                        ))}
                      </tr>

                      {/* Direction */}
                      <tr className="border-b border-slate-200">
                        <td className="p-2 font-medium bg-slate-50 border-r border-slate-200 flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          <span className="hidden sm:inline">Direction</span>
                          <span className="sm:hidden">D</span>
                        </td>
                        {dayForecasts.map((forecast, index) => (
                          <td
                            key={index}
                            className="p-2 text-center border-r border-slate-200 last:border-r-0 bg-slate-100"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <Navigation
                                className="h-3 w-3 text-slate-600"
                                style={{ transform: `rotate(${forecast.windDirection + 180}deg)` }}
                              />
                              <span className="text-xs">{formatDirection(forecast.windDirection)}</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-gray-100 border-t">
          <p className="text-sm text-gray-900 font-medium text-center">
            Prévisions mises à jour toutes les heures • Données AROME 0.01°
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
