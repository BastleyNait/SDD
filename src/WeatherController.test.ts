import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { ERROR_MESSAGES, WeatherController } from './WeatherController';
import type { ForecastResult, GeocodingResult } from './types';

const okGeo: GeocodingResult = { success: true, data: { latitude: 1, longitude: 2, cityName: 'Arequipa', region: 'Departamento de Arequipa', country: 'Perú' } };
const okFc: ForecastResult = { success: true, data: { temperature: 8.44, humidity: 72.2, precipitation: 0 } };

function setup(geo: GeocodingResult | Promise<GeocodingResult>, fc: ForecastResult | Promise<ForecastResult>) {
  const calls: string[] = [];
  const deps = {
    geocoding: { geocode: vi.fn(async () => geo) },
    forecast: { getForecast: vi.fn(async () => { calls.push('forecast'); return fc; }) },
    form: { focus: vi.fn() },
    display: { render: vi.fn(() => calls.push('render')), clear: vi.fn(() => calls.push('clear')) },
    loading: { show: vi.fn(() => calls.push('show')), hide: vi.fn(() => calls.push('hide')) },
    error: { show: vi.fn(), clear: vi.fn() },
  };
  return { deps, calls, controller: new WeatherController(deps) };
}

describe('WeatherController', () => {
  it('flujo exitoso: geocoding → forecast → render', async () => {
    const { deps, controller } = setup(okGeo, okFc);
    await controller.search('Arequipa');
    expect(deps.forecast.getForecast).toHaveBeenCalledWith(1, 2);
    expect(deps.display.render).toHaveBeenCalledWith(okGeo.success && okGeo.data, 'Arequipa', okFc.success && okFc.data);
    expect(deps.loading.hide).toHaveBeenCalled();
    expect(controller.state.status).toBe('success');
  });

  // Feature: weather-forecast-app, Propiedad 13: limpieza al iniciar nueva búsqueda
  it('P13: display.clear() ocurre antes de la solicitud de forecast', async () => {
    const { calls, controller } = setup(okGeo, okFc);
    await controller.search('X');
    expect(calls.indexOf('clear')).toBeGreaterThanOrEqual(0);
    expect(calls.indexOf('clear')).toBeLessThan(calls.indexOf('forecast'));
  });

  it('CITY_NOT_FOUND → mensaje correcto y foco en el input', async () => {
    const { deps, controller } = setup({ success: false, error: { type: 'CITY_NOT_FOUND' } }, okFc);
    await controller.search('zzz');
    expect(deps.error.show).toHaveBeenCalledWith(ERROR_MESSAGES.CITY_NOT_FOUND);
    expect(deps.forecast.getForecast).not.toHaveBeenCalled();
    expect(deps.form.focus).toHaveBeenCalled();
  });
  it('INCOMPLETE_DATA → mensaje correcto', async () => {
    const { deps, controller } = setup(okGeo, { success: false, error: { type: 'INCOMPLETE_DATA' } });
    await controller.search('X');
    expect(deps.error.show).toHaveBeenCalledWith(ERROR_MESSAGES.FORECAST_INCOMPLETE_DATA);
  });
  it('el indicador de carga aparece al iniciar y se oculta (éxito y error)', async () => {
    const a = setup(okGeo, okFc);
    await a.controller.search('X');
    expect(a.calls.indexOf('show')).toBeLessThan(a.calls.indexOf('hide'));
    const b = setup({ success: false, error: { type: 'TIMEOUT' } }, okFc);
    await b.controller.search('X');
    expect(b.deps.loading.show).toHaveBeenCalled();
    expect(b.deps.loading.hide).toHaveBeenCalled();
    expect(b.deps.error.show).toHaveBeenCalledWith(ERROR_MESSAGES.GEOCODING_TIMEOUT);
  });

  // Feature: weather-forecast-app, Propiedad 8 (controlador): el mensaje nombra el servicio — Valida: Req 3.4, 5.4
  it('P8: para cualquier HTTP 300–599 el mensaje indica qué servicio falló', async () => {
    await fc.assert(fc.asyncProperty(fc.integer({ min: 300, max: 599 }), fc.boolean(), async (code, inGeo) => {
      const { deps, controller } = inGeo
        ? setup({ success: false, error: { type: 'SERVICE_ERROR', statusCode: code } }, okFc)
        : setup(okGeo, { success: false, error: { type: 'SERVICE_ERROR', statusCode: code } });
      await controller.search('X');
      const msg = deps.error.show.mock.calls[0][0] as string;
      expect(msg).toContain(inGeo ? 'geocodificación' : 'pronóstico');
      expect(msg).toContain('error');
    }));
  });

  // Feature: weather-forecast-app, Propiedad 15: descarte de respuestas obsoletas — Valida: Req 4.8
  it('P15: con dos búsquedas solapadas solo se refleja la más reciente', async () => {
    type D<T> = { promise: Promise<T>; resolve: (v: T) => void };
    const deferred = <T,>(): D<T> => { let resolve!: (v: T) => void; const promise = new Promise<T>((r) => { resolve = r; }); return { promise, resolve }; };
    await fc.assert(fc.asyncProperty(fc.boolean(), fc.boolean(), fc.boolean(), async (aFirst, aOk, bOk) => {
      const pending: Record<string, D<GeocodingResult>> = { A: deferred(), B: deferred() };
      const deps = {
        geocoding: { geocode: vi.fn((name: string) => pending[name].promise) },
        forecast: { getForecast: vi.fn(async (lat: number) => ({ success: true, data: { temperature: lat, humidity: 50, precipitation: 0 } }) as ForecastResult) },
        form: { focus: vi.fn() },
        display: { render: vi.fn(), clear: vi.fn() },
        loading: { show: vi.fn(), hide: vi.fn() },
        error: { show: vi.fn(), clear: vi.fn() },
      };
      const c = new WeatherController(deps);
      const geoA: GeocodingResult = aOk ? { success: true, data: { latitude: 111, longitude: 0, cityName: 'A', region: '', country: '' } } : { success: false, error: { type: 'CITY_NOT_FOUND' } };
      const geoB: GeocodingResult = bOk ? { success: true, data: { latitude: 222, longitude: 0, cityName: 'B', region: '', country: '' } } : { success: false, error: { type: 'TIMEOUT' } };
      const runA = c.search('A');
      const runB = c.search('B');
      if (aFirst) { pending.A.resolve(geoA); pending.B.resolve(geoB); } else { pending.B.resolve(geoB); pending.A.resolve(geoA); }
      await Promise.all([runA, runB]);
      // Nada de la búsqueda A llega a la pantalla
      for (const call of deps.display.render.mock.calls) expect((call as unknown[])[1]).toBe('B');
      expect(deps.error.show).not.toHaveBeenCalledWith(ERROR_MESSAGES.CITY_NOT_FOUND);
      if (bOk) { expect(deps.display.render).toHaveBeenCalledTimes(1); expect(c.state.status).toBe('success'); }
      else { expect(deps.error.show).toHaveBeenCalledWith(ERROR_MESSAGES.GEOCODING_TIMEOUT); expect(c.state.status).toBe('error'); }
    }));
  });
});
