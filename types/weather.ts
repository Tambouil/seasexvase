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
  windAvg1Min: number;
  windAvg1MinKnots: number;
  windAvg10Min: number;
  windAvg10MinKnots: number;
  windMaxDay: number;
  windMaxDayKnots: number;
  windMaxDayTime: string;
  windMaxMonth: number;
  windMaxMonthKnots: number;
  windMaxYear: number;
  windMaxYearKnots: number;
  beaufortScale: number;
  beaufortDescription: string;
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