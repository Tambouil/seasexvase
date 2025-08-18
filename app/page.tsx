import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherApp } from '@/components/WeatherApp';
import { WindForecast } from '@/components/WindForecast';
import { TrendingUp } from 'lucide-react';
import { Suspense } from 'react';

function WindForecastLoading() {
  return (
    <Card className="overflow-hidden shadow-weather-strong rounded-2xl border-0">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold">
          <TrendingUp className="h-7 w-7" />
          Prévisions du vent - Météo France
        </CardTitle>
        <p className="text-indigo-200 text-base mt-1">Modèle AROME haute résolution - Plage de Fouras</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center py-8 text-gray-900 font-medium">Chargement des prévisions...</div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 space-y-8 max-w-7xl">
        <WeatherApp />

        <Suspense fallback={<WindForecastLoading />}>
          <WindForecast />
        </Suspense>

        {/* Footer */}
        <div className="text-center text-sm text-gray-900 space-y-3 pt-8">
          <p className="font-medium">Données en temps réel • Actualisation automatique toutes les 15 secondes</p>
          <div className="bg-white shadow-weather rounded-2xl p-4 max-w-md mx-auto">
            <p className="text-gray-900 text-sm font-medium">📱 Alertes Telegram automatiques quand le vent dépasse 15 nœuds</p>
          </div>
        </div>
      </div>
    </div>
  );
}
