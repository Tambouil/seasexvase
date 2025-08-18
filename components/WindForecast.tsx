import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, TrendingUp, Wind } from 'lucide-react';

interface ForecastData {
  time: string;
  windSpeed: number;
  windGust: number;
  windDirection: number;
}

async function getWindForecast(): Promise<{ forecasts: ForecastData[]; error?: string }> {
  try {
    const response = await fetch(
      `https://${
        process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || 'http://localhost:3000'
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

  const getWindCategory = (speedKmh: number) => {
    const speedKnots = speedKmh * 0.539957;
    if (speedKnots < 15) return { label: 'Faible', color: 'bg-green-500' };
    if (speedKnots < 25) return { label: 'Modéré', color: 'bg-yellow-500' };
    if (speedKnots < 35) return { label: 'Fort', color: 'bg-orange-500' };
    return { label: 'Très fort', color: 'bg-red-500' };
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Prévisions du vent
          </CardTitle>
        </CardHeader>
        <CardContent>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Prévisions du vent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Aucune prévision disponible</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="h-5 w-5" />
          Prévisions du vent - Météo France
        </CardTitle>
        <CardDescription className="text-blue-100">Modèle AROME haute résolution - Plage de Fouras</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {forecasts.map((forecast, index) => {
            const windCategory = getWindCategory(forecast.windSpeed);
            const forecastDate = new Date(forecast.time);
            const now = new Date();
            const isToday = forecastDate.toDateString() === now.toDateString();

            return (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">
                      {isToday ? "Aujourd'hui" : formatDate(forecast.time)}
                    </div>
                    <div className="text-lg font-semibold flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(forecast.time)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Wind className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-semibold">{forecast.windSpeed.toFixed(0)} km/h</div>
                      <div className="text-sm text-muted-foreground">Rafales: {forecast.windGust.toFixed(0)} km/h</div>
                    </div>
                  </div>
                </div>

                <Badge className={`${windCategory.color} text-white`}>{windCategory.label}</Badge>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-blue-50 border-t">
          <p className="text-sm text-blue-800 text-center">
            Prévisions mises à jour toutes les heures • Données AROME 0.01°
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
