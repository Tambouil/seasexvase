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
  // Positions confirmées depuis ajaxWDwxChatelkts.js
  const windSpeedKnots = parseFloat(data[2]?.toString() || '0'); // Position 2: Vent actuel
  const windSpeed = windSpeedKnots * 1.852; // Convert knots to km/h
  const windDirection = parseFloat(data[3]?.toString() || '0'); // Position 3: Direction
  const windGustKnots = parseFloat(data[140]?.toString() || '0'); // Position 140: Rafales actuelles
  const windGust = windGustKnots * 1.852; // Convert knots to km/h
  
  // Wind averages
  const windAvg1MinKnots = parseFloat(data[1]?.toString() || '0'); // Position 1: Moyenne 1 minute
  const windAvg1Min = windAvg1MinKnots * 1.852;
  const windAvg10MinKnots = parseFloat(data[158]?.toString() || '0'); // Position 158: Moyenne 10 minutes
  const windAvg10Min = windAvg10MinKnots * 1.852;
  
  // Max wind statistics
  const windMaxDayKnots = parseFloat(data[71]?.toString() || '0'); // Max du jour
  const windMaxDay = windMaxDayKnots * 1.852;
  const windMaxDayTime = data[135]?.toString() || '';
  
  const windMax1HourKnots = parseFloat(data[133]?.toString() || '0'); // Max sur 1 heure
  const windMax1Hour = windMax1HourKnots * 1.852;
  
  // Monthly and yearly max (these positions might need adjustment)
  const windMaxMonthKnots = parseFloat(data[133]?.toString() || '0');
  const windMaxMonth = windMaxMonthKnots * 1.852;
  const windMaxYearKnots = parseFloat(data[134]?.toString() || '0');
  const windMaxYear = windMaxYearKnots * 1.852;
  
  // Beaufort scale calculation
  const beaufortScale = getBeaufortScale(windSpeedKnots);
  const beaufortDescription = getBeaufortDescription(beaufortScale);
  
  const rainfall = parseFloat(data[7]?.toString() || '0');
  const rainfallRate = parseFloat(data[10]?.toString() || '0');
  const solarRadiation = parseFloat(data[174]?.toString() || '0');
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
    windAvg1Min,
    windAvg1MinKnots,
    windAvg10Min,
    windAvg10MinKnots,
    windMaxDay,
    windMaxDayKnots,
    windMaxDayTime,
    windMax1Hour,
    windMax1HourKnots,
    windMaxMonth,
    windMaxMonthKnots,
    windMaxYear,
    windMaxYearKnots,
    beaufortScale,
    beaufortDescription,
    rainfall,
    rainfallRate,
    solarRadiation,
    uvIndex,
    condition,
    lastUpdate: new Date(),
  };
}

function getBeaufortScale(windSpeedKnots: number): number {
  if (windSpeedKnots < 1) return 0;
  if (windSpeedKnots <= 3) return 1;
  if (windSpeedKnots <= 6) return 2;
  if (windSpeedKnots <= 10) return 3;
  if (windSpeedKnots <= 16) return 4;
  if (windSpeedKnots <= 21) return 5;
  if (windSpeedKnots <= 27) return 6;
  if (windSpeedKnots <= 33) return 7;
  if (windSpeedKnots <= 40) return 8;
  if (windSpeedKnots <= 47) return 9;
  if (windSpeedKnots <= 55) return 10;
  if (windSpeedKnots <= 63) return 11;
  return 12;
}

function getBeaufortDescription(scale: number): string {
  const descriptions = [
    'Calme',
    'Très légère brise',
    'Légère brise',
    'Petite brise',
    'Jolie brise',
    'Bonne brise',
    'Vent frais',
    'Grand frais',
    'Coup de vent',
    'Fort coup de vent',
    'Tempête',
    'Violente tempête',
    'Ouragan'
  ];
  return descriptions[scale] || 'Inconnu';
}