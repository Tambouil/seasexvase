import { WeatherCard } from '@/components/WeatherCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
  Thermometer,
  Wind,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function WeatherApp() {
  const { data, loading, error, refresh } = useWeather(15000);
  const [useKnots, setUseKnots] = useState(true);
  const [countdown, setCountdown] = useState(15);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

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

  const getWindStrength = (speedKnots: number) => {
    // Using knots for wind strength categories based on marine scale
    if (speedKnots < 31) return { label: 'Normal', color: 'bg-green-500' };
    if (speedKnots < 41) return { label: 'Fort', color: 'bg-orange-500' };
    if (speedKnots < 54) return { label: 'Violent', color: 'bg-red-500' };
    return { label: 'Tempétueux', color: 'bg-purple-500' };
  };

  const windStrength = getWindStrength(data.windSpeedKnots);

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
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm font-medium">Prochaine dans {countdown}s</span>
            </div>

            <div className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-lg px-3 py-1.5 shadow-sm">
              <span className="text-sm font-medium text-gray-700">km/h</span>
              <Switch
                checked={useKnots}
                onCheckedChange={setUseKnots}
                className="data-[state=checked]:bg-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">kts</span>
            </div>
          </div>

          <Separator className="max-w-md mx-auto" />
        </div>

        {/* Wind Statistics - Primary Feature */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-cyan-600 to-blue-700 rounded-2xl p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Wind className="h-10 w-10" />
                <h2 className="text-3xl font-bold">Conditions de Vent</h2>
              </div>
              <Badge className={`text-lg px-6 py-2 ${windStrength.color} text-white font-bold`}>
                {windStrength.label}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Wind */}
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="text-cyan-100 text-sm uppercase tracking-wide mb-2">Vent Actuel</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-5xl font-bold">{windSpeedDisplay.toFixed(1)}</div>
                  <div className="text-2xl">{windUnit}</div>
                </div>
                <div className="mt-3 text-xl font-semibold flex items-center gap-2">
                  <div className="bg-white/20 rounded-lg px-3 py-1">{formatDirection(data.windDirection)}</div>
                  <div>{data.windDirection.toFixed(0)}°</div>
                </div>
              </div>

              {/* Gusts & Averages */}
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="text-cyan-100 text-sm uppercase tracking-wide mb-2">Rafales & Moyennes</div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-100">Rafales:</span>
                    <span className="text-2xl font-bold">
                      {windGustDisplay.toFixed(1)} {windUnit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-100">Moy 1min:</span>
                    <span className="text-xl font-semibold">
                      {useKnots ? data.windAvg1MinKnots.toFixed(1) : data.windAvg1Min.toFixed(1)} {windUnit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-100">Moy 10min:</span>
                    <span className="text-xl font-semibold">
                      {useKnots ? data.windAvg10MinKnots.toFixed(1) : data.windAvg10Min.toFixed(1)} {windUnit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily Max */}
              <div className="bg-orange-500/20 backdrop-blur rounded-xl p-6 border border-orange-400/30">
                <div className="text-orange-100 text-sm uppercase tracking-wide mb-2">Maximum du Jour</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-5xl font-bold text-orange-300">
                    {useKnots ? data.windMaxDayKnots.toFixed(1) : data.windMaxDay.toFixed(1)}
                  </div>
                  <div className="text-2xl text-orange-300">{windUnit}</div>
                </div>
                {data.windMaxDayTime && <div className="mt-3 text-xl text-orange-200">à {data.windMaxDayTime}</div>}
              </div>
            </div>

            {/* Beaufort Scale */}
            <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-2xl font-bold text-center">
                Force {data.beaufortScale} - {data.beaufortDescription}
              </div>
              <div className="mt-2 text-center text-cyan-100">
                {data.beaufortScale >= 6 && '⚠️ Conditions de navigation difficiles'}
                {data.beaufortScale >= 4 && data.beaufortScale < 6 && '✅ Bonnes conditions de navigation'}
                {data.beaufortScale < 4 && '💤 Vent faible pour la navigation'}
              </div>
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
            title="Température"
            value={data.temperature.toFixed(1)}
            unit="°C"
            subtitle={
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Min:</span>
                  <span className="font-medium">{data.minTemperature.toFixed(1)}°C</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Max:</span>
                  <span className="font-medium">{data.maxTemperature.toFixed(1)}°C</span>
                </div>
              </div>
            }
            icon={<Thermometer className="text-orange-500" />}
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
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Données en temps réel • Actualisation automatique toutes les 15 secondes</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md mx-auto">
            <p className="text-blue-800 text-xs">📱 Alertes Telegram automatiques quand le vent &gt; 15 nœuds</p>
          </div>
        </div>
      </div>
    </div>
  );
}
