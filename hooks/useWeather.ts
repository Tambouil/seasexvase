import { useState, useEffect, useCallback } from 'react';
import { fetchWeatherData } from '@/services/weatherApi';
import type { WeatherData } from '@/types/weather';

interface UseWeatherReturn {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWeather(refreshInterval: number = 30000): UseWeatherReturn {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const weatherData = await fetchWeatherData();
      setData(weatherData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    
    const interval = setInterval(refresh, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refresh, refreshInterval]);

  return { data, loading, error, refresh };
}