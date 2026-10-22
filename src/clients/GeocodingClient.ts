import type { GeocodingClientLike, HttpResponse } from '../types';
import { fetchWithTimeout } from './http';

export const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export function buildGeocodingUrl(cityName: string): string {
  return `${GEOCODING_BASE_URL}?name=${encodeURIComponent(cityName)}&count=1`;
}

export class GeocodingClient implements GeocodingClientLike {
  fetch(cityName: string): Promise<HttpResponse> {
    return fetchWithTimeout(buildGeocodingUrl(cityName));
  }
}
