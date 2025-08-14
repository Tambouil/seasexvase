export interface WeatherData {
  temperature: number;
  minTemperature: number;
  maxTemperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windSpeedKnots: number;
  windDirection: number;
  windGust: number;
  windGustKnots: number;
  rainfall: number;
  rainfallRate: number;
  solarRadiation: number;
  uvIndex: number;
  condition: string;
  lastUpdate: Date;
}

export interface RawWeatherData extends Array<string | number> {
  [index: number]: string | number;
}