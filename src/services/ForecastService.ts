import {
  ClientError,
  type ForecastClientLike,
  type ForecastResult,
  type HttpResponse,
} from '../types';

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isMissing = (v: unknown): boolean => v === null || v === undefined;

export class ForecastService {
  constructor(private readonly client: ForecastClientLike) {}

  async getForecast(lat: number, lon: number): Promise<ForecastResult> {
    let response: HttpResponse;
    try {
      response = await this.client.fetch(lat, lon);
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
    const current = (body as { current?: unknown } | null)?.current;
    if (typeof body !== 'object' || body === null || typeof current !== 'object' || current === null) {
      return { success: false, error: { type: 'INVALID_RESPONSE' } };
    }

    const c = current as Record<string, unknown>;
    const t = c.temperature_2m;
    const h = c.relative_humidity_2m;
    const p = c.precipitation;

    if (isMissing(t) || isMissing(h) || isMissing(p)) {
      return { success: false, error: { type: 'INCOMPLETE_DATA' } };
    }
    if (!isNum(t) || !isNum(h) || !isNum(p)) {
      return { success: false, error: { type: 'INVALID_RESPONSE' } };
    }

    return { success: true, data: { temperature: t, humidity: h, precipitation: p } };
  }
}
