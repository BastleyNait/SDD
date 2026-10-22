import fc from 'fast-check';
import { beforeEach, describe, expect, it } from 'vitest';
import { CitySearchForm } from '../src/components/CitySearchForm';
import { ErrorMessage } from '../src/components/ErrorMessage';
import { LoadingIndicator } from '../src/components/LoadingIndicator';
import { WeatherDisplay } from '../src/components/WeatherDisplay';
import { ForecastService } from '../src/services/ForecastService';
import { GeocodingService } from '../src/services/GeocodingService';
import { ERROR_MESSAGES, WeatherController } from '../src/WeatherController';
import type { HttpResponse } from '../src/types';

const resp = (body: unknown, status = 200): HttpResponse => ({ ok: status < 300, status, json: async () => body });

function mount(geoBody: unknown, fcBody: unknown, geoStatus = 200) {
  document.body.innerHTML = '<div id="s"></div><div id="l"></div><div id="e"></div><div id="d"></div>';
  const g = (id: string) => document.getElementById(id)!;
  let controller!: WeatherController;
  const form = new CitySearchForm(g('s'), (c) => void controller.search(c), () => controller.invalidInput());
  controller = new WeatherController({
    geocoding: new GeocodingService({ fetch: async () => resp(geoBody, geoStatus) }),
    forecast: new ForecastService({ fetch: async () => resp(fcBody) }),
    form, display: new WeatherDisplay(g('d')), loading: new LoadingIndicator(g('l')), error: new ErrorMessage(g('e')),
  });
  return { form, g };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('integración E2E (clientes simulados)', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('búsqueda → geocoding → forecast → datos visibles en el DOM', async () => {
    const { form, g } = mount(
      { results: [{ name: 'Arequipa', latitude: -16.39, longitude: -71.53 }] },
      { current: { temperature_2m: 18.46, relative_humidity_2m: 40.4, precipitation: 0.04 } });
    form.input.value = '  Arequipa ';
    form.button.click();
    await tick();
    expect(g('d').textContent).toContain('Arequipa');
    expect(g('d').textContent).toContain('18.5 °C');
    expect(g('d').textContent).toContain('40 %');
    expect(g('d').textContent).toContain('0.0 mm');
    expect(g('l').hidden).toBe(true);
    expect(g('e').textContent).toBe('');
  });

  it('geocoding sin resultados → error visible e input accesible', async () => {
    const { form, g } = mount({ results: [] }, {});
    form.input.value = 'Xyzzy';
    form.button.click();
    await tick();
    expect(g('e').textContent).toBe(ERROR_MESSAGES.CITY_NOT_FOUND);
    expect(g('d').textContent).toBe('');
    expect(form.input.disabled).toBe(false);
  });

  it('forecast con datos incompletos → mensaje de datos incompletos', async () => {
    const { form, g } = mount(
      { results: [{ name: 'Lima', latitude: -12, longitude: -77 }] },
      { current: { temperature_2m: 20, relative_humidity_2m: null, precipitation: 0 } });
    form.input.value = 'Lima';
    form.button.click();
    await tick();
    expect(g('e').textContent).toBe(ERROR_MESSAGES.FORECAST_INCOMPLETE_DATA);
  });

  // Feature: weather-forecast-app, Propiedad 16 — Valida: Req 1.7 (defecto hallado en la prueba en vivo)
  it('P16: tras enviar solo espacios, el único mensaje visible es el de validación y el display se conserva', async () => {
    await fc.assert(fc.asyncProperty(fc.boolean(), fc.stringOf(fc.constantFrom(' ', '\t')), async (prevOk, blanks) => {
      const { form, g } = prevOk
        ? mount({ results: [{ name: 'Arequipa', latitude: -16.4, longitude: -71.5 }] }, { current: { temperature_2m: 16.9, relative_humidity_2m: 43, precipitation: 0 } })
        : mount({ results: [] }, {});
      form.input.value = 'Arequipa';
      form.button.click();
      await tick();
      const before = g('d').textContent;
      form.input.value = blanks;
      form.button.click();
      expect(g('e').textContent).toBe('');
      expect(g('s').querySelector('.validation-message')!.textContent).toBe('El nombre de la ciudad es obligatorio.');
      expect(g('d').textContent).toBe(before);
    }));
  });
});
