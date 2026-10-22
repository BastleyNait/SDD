import { describe, expect, it, vi } from 'vitest';
import { ERROR_MESSAGES, WeatherController } from './WeatherController';
import type { ForecastResult, GeocodingResult } from './types';

const okGeo: GeocodingResult = { success: true, data: { latitude: 1, longitude: 2, cityName: 'Arequipa' } };
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
    expect(deps.display.render).toHaveBeenCalledWith('Arequipa', 'Arequipa', okFc.success && okFc.data);
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
});
