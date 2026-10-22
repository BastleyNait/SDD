export interface Coordinates {
  latitude: number;
  longitude: number;
  cityName: string;
  /** admin1 de la Geocoding API ('' si no viene) — v1.1 */
  region: string;
  /** country de la Geocoding API ('' si no viene) — v1.1 */
  country: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
}

export type GeocodingError =
  | { type: 'CITY_NOT_FOUND' }
  | { type: 'NETWORK_ERROR' }
  | { type: 'TIMEOUT' }
  | { type: 'SERVICE_ERROR'; statusCode: number }
  | { type: 'INVALID_RESPONSE' };

export type ForecastError =
  | { type: 'NETWORK_ERROR' }
  | { type: 'TIMEOUT' }
  | { type: 'SERVICE_ERROR'; statusCode: number }
  | { type: 'INCOMPLETE_DATA' }
  | { type: 'INVALID_RESPONSE' };

export type GeocodingResult =
  | { success: true; data: Coordinates }
  | { success: false; error: GeocodingError };

export type ForecastResult =
  | { success: true; data: WeatherData }
  | { success: false; error: ForecastError };

export type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; cityName: string; weather: WeatherData }
  | { status: 'error'; message: string };

/** Error lanzado por los clientes HTTP (red o timeout). */
export class ClientError extends Error {
  constructor(public readonly kind: 'NETWORK' | 'TIMEOUT') {
    super(kind);
    this.name = 'ClientError';
  }
}

/** Abstracción mínima de Response para facilitar el testing. */
export interface HttpResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export interface GeocodingClientLike {
  fetch(cityName: string): Promise<HttpResponse>;
}

export interface ForecastClientLike {
  fetch(lat: number, lon: number): Promise<HttpResponse>;
}
