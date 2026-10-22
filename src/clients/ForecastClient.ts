import type { ForecastClientLike, HttpResponse } from '../types';
import { fetchWithTimeout } from './http';

export const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export function buildForecastUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,relative_humidity_2m,precipitation',
  });
  // Mantiene las comas legibles en la URL (la API las acepta tanto codificadas como no).
  return `${FORECAST_BASE_URL}?${params.toString().replace(/%2C/g, ',')}`;
}

export class ForecastClient implements ForecastClientLike {
  fetch(lat: number, lon: number): Promise<HttpResponse> {
    return fetchWithTimeout(buildForecastUrl(lat, lon));
  }
}
