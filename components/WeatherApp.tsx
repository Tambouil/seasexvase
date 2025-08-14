import { WeatherCard } from '@/components/WeatherCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useWeather } from '@/hooks/useWeather';
import {
  Activity,
  AlertTriangle,
  Clock,
  CloudRain,
  Droplets,
  Eye,
  RefreshCw,
  Sun,
  Thermometer,
  ToggleLeft,
  ToggleRight,
  Wind,
} from 'lucide-react';
import { useState } from 'react';

export function WeatherApp() {
  const { data, loading, error, refresh } = useWeather(30000);
  const [useKnots, setUseKnots] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-6 text-blue-600" />
          <h2 className="text-2xl font-semibold text-blue-900 mb-2">Chargement des données météo</h2>
          <p className="text-blue-600">Station de Châtelaillon-Plage</p>
          <Progress value={66} className="w-64 mx-auto mt-4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Alert className="max-w-md bg-white border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Erreur de connexion:</strong> {error}
          </AlertDescription>
          <Button
            onClick={refresh}
            variant="outline"
            className="mt-4 w-full border-red-200 text-red-700 hover:bg-red-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  const formatDirection = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getConditionBadge = (humidity: number) => {
    if (humidity > 80)
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Humide
        </Badge>
      );
    if (humidity < 30)
      return (
        <Badge variant="outline" className="border-yellow-200 text-yellow-800">
          Sec
        </Badge>
      );
    return (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Normal
      </Badge>
    );
  };

  const getWindStrength = (speed: number) => {
    // Using km/h as reference for wind strength categories
    if (speed < 10) return { label: 'Faible', color: 'bg-green-500' };
    if (speed < 25) return { label: 'Modéré', color: 'bg-yellow-500' };
    if (speed < 50) return { label: 'Fort', color: 'bg-orange-500' };
    return { label: 'Très fort', color: 'bg-red-500' };
  };

  const windStrength = getWindStrength(data.windSpeed);

  const windSpeedDisplay = useKnots ? data.windSpeedKnots : data.windSpeed;
  const windGustDisplay = useKnots ? data.windGustKnots : data.windGust;
  const windUnit = useKnots ? 'kts' : 'km/h';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Station Météo Châtelaillon
            </h1>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Mise à jour: {data.lastUpdate.toLocaleTimeString('fr-FR')}</span>
            </div>

            <Button onClick={() => setUseKnots(!useKnots)} variant="outline" size="sm" className="shadow-sm">
              {useKnots ? <ToggleRight className="h-4 w-4 mr-2" /> : <ToggleLeft className="h-4 w-4 mr-2" />}
              {useKnots ? 'Nœuds' : 'km/h'}
            </Button>

            <Button onClick={refresh} variant="outline" size="sm" className="shadow-sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>

          <Separator className="max-w-md mx-auto" />
        </div>

        {/* Current Temperature - Featured */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Température actuelle</h2>
                <div className="text-6xl font-bold mb-2">{data.temperature.toFixed(1)}°</div>
                <div className="flex items-center gap-4">
                  <span className="text-blue-100">Min: {data.minTemperature.toFixed(1)}°C</span>
                  <span className="text-blue-100">•</span>
                  <span className="text-blue-100">Max: {data.maxTemperature.toFixed(1)}°C</span>
                </div>
              </div>
              <Thermometer className="h-24 w-24 text-white opacity-20" />
            </div>
          </div>
        </div>

        {/* Weather Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <WeatherCard
            title="Humidité"
            value={data.humidity.toFixed(0)}
            unit="%"
            subtitle={
              <div className="flex items-center gap-2">
                <span>État: </span>
                {getConditionBadge(data.humidity)}
              </div>
            }
            icon={<Droplets className="text-blue-500" />}
            className="hover:shadow-lg transition-shadow"
          />

          <WeatherCard
            title="Pression atmosphérique"
            value={data.pressure.toFixed(1)}
            unit="hPa"
            subtitle={
              <Progress
                value={Math.min(100, Math.max(0, ((data.pressure - 980) / 60) * 100))}
                className="w-full mt-2"
              />
            }
            icon={<Eye className="text-purple-500" />}
            className="hover:shadow-lg transition-shadow"
          />

          <WeatherCard
            title="Vent"
            value={windSpeedDisplay.toFixed(1)}
            unit={windUnit}
            subtitle={
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {formatDirection(data.windDirection)} {data.windDirection.toFixed(0)}°
                  </Badge>
                  <Badge className={`text-xs text-white ${windStrength.color}`}>{windStrength.label}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Rafales: {windGustDisplay.toFixed(1)} {windUnit}
                </div>
              </div>
            }
            icon={<Wind className="text-gray-500" />}
            className="hover:shadow-lg transition-shadow"
          />

          <WeatherCard
            title="Précipitations"
            value={data.rainfall.toFixed(1)}
            unit="mm"
            subtitle={
              <div className="space-y-1">
                <div className="text-sm">Taux: {data.rainfallRate.toFixed(1)} mm/h</div>
                <Progress value={Math.min(100, (data.rainfallRate / 10) * 100)} className="w-full" />
              </div>
            }
            icon={<CloudRain className="text-blue-400" />}
            className="hover:shadow-lg transition-shadow"
          />

          <WeatherCard
            title="Rayonnement solaire"
            value={data.solarRadiation.toFixed(0)}
            unit="W/m²"
            subtitle={
              <div className="space-y-1">
                <div className="text-sm">Index UV: {data.uvIndex.toFixed(1)}</div>
                <Progress value={Math.min(100, (data.solarRadiation / 1000) * 100)} className="w-full" />
              </div>
            }
            icon={<Sun className="text-yellow-500" />}
            className="hover:shadow-lg transition-shadow lg:col-span-2"
          />
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Données en temps réel • Actualisation automatique toutes les 30 secondes</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md mx-auto">
            <p className="text-blue-800 text-xs">📱 Alertes Telegram automatiques quand le vent &gt; 5 nœuds</p>
          </div>
        </div>
      </div>
    </div>
  );
}
