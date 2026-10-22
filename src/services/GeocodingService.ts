import {
  ClientError,
  type GeocodingClientLike,
  type GeocodingResult,
  type HttpResponse,
} from '../types';

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export class GeocodingService {
  constructor(private readonly client: GeocodingClientLike) {}

  async geocode(cityName: string): Promise<GeocodingResult> {
    let response: HttpResponse;
    try {
      response = await this.client.fetch(cityName);
    } catch (err) {
      const timeout = err instanceof ClientError && err.kind === 'TIMEOUT';
      return { success: false, error: { type: timeout ? 'TIMEOUT' : 'NETWORK_ERROR' } };
    }

    if (!response.ok) {
      return { success: false, error: { type: 'SERVICE_ERROR', statusCode: response.status } };
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return { success: false, error: { type: 'INVALID_RESPONSE' } };
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return { success: false, error: { type: 'INVALID_RESPONSE' } };
    }

    const results = (body as { results?: unknown }).results;
    if (!Array.isArray(results) || results.length === 0) {
      return { success: false, error: { type: 'CITY_NOT_FOUND' } };
    }
    const first = results[0] as { latitude?: unknown; longitude?: unknown; name?: unknown; admin1?: unknown; country?: unknown } | null;
    if (!first || !isNum(first.latitude) || !isNum(first.longitude)) {
      return { success: false, error: { type: 'CITY_NOT_FOUND' } };
    }

    return {
      success: true,
      data: {
        latitude: first.latitude,
        longitude: first.longitude,
        cityName: str(first.name),
        region: str(first.admin1),
        country: str(first.country),
      },
    };
  }
}
