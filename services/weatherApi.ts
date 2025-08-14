import type { WeatherData, RawWeatherData } from '@/types/weather';

const WEATHER_API_URL = '/api/weather';

export async function fetchWeatherData(): Promise<WeatherData> {
  try {
    const response = await fetch(`${WEATHER_API_URL}?${Date.now()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    const data = text.split(' ') as RawWeatherData;
    
    return parseWeatherData(data);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

function parseWeatherData(data: RawWeatherData): WeatherData {
  const temperature = parseFloat(data[4]?.toString() || '0');
  const humidity = parseFloat(data[5]?.toString() || '0');
  const pressure = parseFloat(data[6]?.toString() || '0');
  // Les données sont déjà en nœuds dans clientraw.txt
  const windSpeedKnots = parseFloat(data[1]?.toString() || '0'); // knots
  const windSpeed = windSpeedKnots * 1.852; // Convert knots to km/h
  const windDirection = parseFloat(data[3]?.toString() || '0');
  const windGustKnots = parseFloat(data[2]?.toString() || '0'); // knots
  const windGust = windGustKnots * 1.852; // Convert knots to km/h
  const rainfall = parseFloat(data[7]?.toString() || '0');
  const rainfallRate = parseFloat(data[10]?.toString() || '0');
  const solarRadiation = parseFloat(data[127]?.toString() || '0');
  const uvIndex = parseFloat(data[79]?.toString() || '0');
  
  // Min/Max temperatures (positions may vary)
  const minTemperature = parseFloat(data[47]?.toString() || temperature.toString());
  const maxTemperature = parseFloat(data[46]?.toString() || temperature.toString());
  
  // Weather condition (simplified)
  const condition = humidity > 80 ? 'Humide' : humidity < 30 ? 'Sec' : 'Normal';
  
  return {
    temperature,
    minTemperature,
    maxTemperature,
    humidity,
    pressure,
    windSpeed,
    windSpeedKnots,
    windDirection,
    windGust,
    windGustKnots,
    rainfall,
    rainfallRate,
    solarRadiation,
    uvIndex,
    condition,
    lastUpdate: new Date(),
  };
}