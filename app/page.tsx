import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherApp } from '@/components/WeatherApp';
import { WindForecast } from '@/components/WindForecast';
import { TrendingUp } from 'lucide-react';
import { Suspense } from 'react';

function WindForecastLoading() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Prévisions du vent
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">Chargement des prévisions...</div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 space-y-6 max-w-7xl">
        <WeatherApp />

        <Suspense fallback={<WindForecastLoading />}>
          <WindForecast />
        </Suspense>
      </div>
    </div>
  );
}
