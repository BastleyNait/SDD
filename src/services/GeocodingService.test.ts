import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { buildGeocodingUrl } from '../clients/GeocodingClient';
import { fetchWithTimeout } from '../clients/http';
import { ClientError, type HttpResponse } from '../types';
import { GeocodingService } from './GeocodingService';

const resp = (body: unknown, status = 200): HttpResponse => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});
const svc = (r: HttpResponse | Error) =>
  new GeocodingService({ fetch: async () => { if (r instanceof Error) throw r; return r; } });

describe('GeocodingClient URL', () => {
  // Feature: weather-forecast-app, Propiedad 3: URL de geocodificación
  it('P3: contiene name URL-encoded y count=1', () => {
    fc.assert(fc.property(fc.string({ minLength: 1 }), (name) => {
      const url = new URL(buildGeocodingUrl(name));
      expect(url.searchParams.get('name')).toBe(name);
      expect(url.searchParams.get('count')).toBe('1');
      expect(buildGeocodingUrl(name)).toContain(`name=${encodeURIComponent(name)}`);
    }));
  });
});

describe('GeocodingService', () => {
  // Feature: weather-forecast-app, Propiedad 4: extracción de coordenadas
  it('P4: extrae lat/lon del primer resultado sin transformar', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({ latitude: fc.double({ noNaN: true, noDefaultInfinity: true }), longitude: fc.double({ noNaN: true, noDefaultInfinity: true }), name: fc.string() }),
      async (r) => {
        const res = await svc(resp({ results: [r, { latitude: 1, longitude: 2, name: 'otro' }] })).geocode('x');
        expect(res).toEqual({ success: true, data: { latitude: r.latitude, longitude: r.longitude, cityName: r.name } });
      }));
  });

  // Feature: weather-forecast-app, Propiedad 5: coordenadas faltantes
  it('P5: lat/lon null/undefined/ausentes → CITY_NOT_FOUND', async () => {
    const missing = fc.constantFrom(null, undefined, 'ausente');
    await fc.assert(fc.asyncProperty(missing, missing, async (la, lo) => {
      const r: Record<string, unknown> = { name: 'X' };
      if (la !== 'ausente') r.latitude = la;
      if (lo !== 'ausente') r.longitude = lo;
      // al menos uno debe faltar: forzamos latitude faltante
      r.latitude = la === 'ausente' ? undefined : la;
      const res = await svc(resp({ results: [r] })).geocode('x');
      expect(res).toEqual({ success: false, error: { type: 'CITY_NOT_FOUND' } });
    }));
  });

  // Feature: weather-forecast-app, Propiedad 8: HTTP no-2xx
  it('P8: HTTP 300–599 → SERVICE_ERROR con el código', async () => {
    await fc.assert(fc.asyncProperty(fc.integer({ min: 300, max: 599 }), async (code) => {
      const res = await svc(resp({}, code)).geocode('x');
      expect(res).toEqual({ success: false, error: { type: 'SERVICE_ERROR', statusCode: code } });
    }));
  });

  // Feature: weather-forecast-app, Propiedad 9: 2xx con cuerpo inválido
  it('P9: cuerpo no parseable → INVALID_RESPONSE', async () => {
    const bad: HttpResponse = { ok: true, status: 200, json: async () => { throw new SyntaxError('x'); } };
    expect(await svc(bad).geocode('x')).toEqual({ success: false, error: { type: 'INVALID_RESPONSE' } });
    await fc.assert(fc.asyncProperty(fc.oneof(fc.string(), fc.integer(), fc.constant(null), fc.array(fc.integer())), async (body) => {
      expect(await svc(resp(body)).geocode('x')).toEqual({ success: false, error: { type: 'INVALID_RESPONSE' } });
    }));
  });

  it('0 resultados / results ausente → CITY_NOT_FOUND', async () => {
    expect(await svc(resp({ results: [] })).geocode('x')).toEqual({ success: false, error: { type: 'CITY_NOT_FOUND' } });
    expect(await svc(resp({})).geocode('x')).toEqual({ success: false, error: { type: 'CITY_NOT_FOUND' } });
  });
  it('error de red → NETWORK_ERROR', async () => {
    expect(await svc(new ClientError('NETWORK')).geocode('x')).toEqual({ success: false, error: { type: 'NETWORK_ERROR' } });
  });
  it('timeout → TIMEOUT', async () => {
    expect(await svc(new ClientError('TIMEOUT')).geocode('x')).toEqual({ success: false, error: { type: 'TIMEOUT' } });
  });
  it('éxito con un resultado válido', async () => {
    const res = await svc(resp({ results: [{ name: 'Arequipa', latitude: -16.4, longitude: -71.5 }] })).geocode('Arequipa');
    expect(res).toEqual({ success: true, data: { latitude: -16.4, longitude: -71.5, cityName: 'Arequipa' } });
  });
});

describe('fetchWithTimeout', () => {
  it('aborta a los 10 s y lanza ClientError TIMEOUT', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', (_u: string, init: RequestInit) => new Promise((_res, rej) => {
      init.signal!.addEventListener('abort', () => rej(Object.assign(new Error('abort'), { name: 'AbortError' })));
    }));
    const p = fetchWithTimeout('https://x.test');
    const assertion = expect(p).rejects.toMatchObject({ kind: 'TIMEOUT' });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  it('error de red → ClientError NETWORK', async () => {
    vi.stubGlobal('fetch', async () => { throw new TypeError('fail'); });
    await expect(fetchWithTimeout('https://x.test')).rejects.toMatchObject({ kind: 'NETWORK' });
    vi.unstubAllGlobals();
  });
});
