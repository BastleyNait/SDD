import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { buildForecastUrl } from '../clients/ForecastClient';
import { ClientError, type HttpResponse } from '../types';
import { ForecastService } from './ForecastService';

const resp = (body: unknown, status = 200): HttpResponse => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});
const svc = (r: HttpResponse | Error) =>
  new ForecastService({ fetch: async () => { if (r instanceof Error) throw r; return r; } });
const num = fc.double({ noNaN: true, noDefaultInfinity: true });

describe('ForecastClient URL', () => {
  // Feature: weather-forecast-app, Propiedad 6: URL de pronóstico
  it('P6: contiene latitude, longitude y current con las 3 variables', () => {
    fc.assert(fc.property(fc.double({ min: -90, max: 90, noNaN: true }), fc.double({ min: -180, max: 180, noNaN: true }), (lat, lon) => {
      const url = new URL(buildForecastUrl(lat, lon));
      // Igualdad numérica (===): -0 y +0 son la misma coordenada. fast-check halló el
      // contraejemplo [-0, 0] con toBe (Object.is) en el checkpoint 6.
      expect(Number(url.searchParams.get('latitude')) === lat).toBe(true);
      expect(Number(url.searchParams.get('longitude')) === lon).toBe(true);
      expect(url.searchParams.get('current')).toBe('temperature_2m,relative_humidity_2m,precipitation');
    }));
  });
});

describe('ForecastService', () => {
  // Feature: weather-forecast-app, Propiedad 7: round-trip de parseo
  it('P7: WeatherData == valores crudos del JSON', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({ temperature_2m: num, relative_humidity_2m: num, precipitation: num }),
      async (c) => {
        const res = await svc(resp({ current: c })).getForecast(0, 0);
        expect(res).toEqual({ success: true, data: { temperature: c.temperature_2m, humidity: c.relative_humidity_2m, precipitation: c.precipitation } });
      }));
  });

  // Feature: weather-forecast-app, Propiedad 10: campos faltantes → incompleto
  it('P10: algún campo null/undefined/ausente → INCOMPLETE_DATA', async () => {
    const field = fc.constantFrom<unknown>(1.5, null, undefined, 'ausente');
    await fc.assert(fc.asyncProperty(field, field, field, async (a, b, c) => {
      fc.pre([a, b, c].some((v) => v === null || v === undefined || v === 'ausente'));
      const cur: Record<string, unknown> = {};
      const set = (k: string, v: unknown) => { if (v !== 'ausente') cur[k] = v; };
      set('temperature_2m', a); set('relative_humidity_2m', b); set('precipitation', c);
      expect(await svc(resp({ current: cur })).getForecast(0, 0)).toEqual({ success: false, error: { type: 'INCOMPLETE_DATA' } });
    }));
  });

  // Feature: weather-forecast-app, Propiedad 8: HTTP no-2xx
  it('P8: HTTP 300–599 → SERVICE_ERROR', async () => {
    await fc.assert(fc.asyncProperty(fc.integer({ min: 300, max: 599 }), async (code) => {
      expect(await svc(resp({}, code)).getForecast(0, 0)).toEqual({ success: false, error: { type: 'SERVICE_ERROR', statusCode: code } });
    }));
  });

  // Feature: weather-forecast-app, Propiedad 9: 2xx con cuerpo inválido
  it('P9: cuerpos malformados / sin current → INVALID_RESPONSE', async () => {
    await fc.assert(fc.asyncProperty(fc.oneof(fc.string(), fc.integer(), fc.constant(null), fc.record({ foo: fc.string() })), async (body) => {
      expect(await svc(resp(body)).getForecast(0, 0)).toEqual({ success: false, error: { type: 'INVALID_RESPONSE' } });
    }));
    const bad: HttpResponse = { ok: true, status: 200, json: async () => { throw new SyntaxError('x'); } };
    expect(await svc(bad).getForecast(0, 0)).toEqual({ success: false, error: { type: 'INVALID_RESPONSE' } });
  });

  it('error de red → NETWORK_ERROR', async () => {
    expect(await svc(new ClientError('NETWORK')).getForecast(0, 0)).toEqual({ success: false, error: { type: 'NETWORK_ERROR' } });
  });
  it('timeout → TIMEOUT', async () => {
    expect(await svc(new ClientError('TIMEOUT')).getForecast(0, 0)).toEqual({ success: false, error: { type: 'TIMEOUT' } });
  });
  it('éxito con todos los campos', async () => {
    const res = await svc(resp({ current: { temperature_2m: 8.4, relative_humidity_2m: 72, precipitation: 0 } })).getForecast(1, 2);
    expect(res).toEqual({ success: true, data: { temperature: 8.4, humidity: 72, precipitation: 0 } });
  });
});
