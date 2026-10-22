// Pruebas de contrato (v1.1): respuestas REALES de Open-Meteo capturadas el 22-10-2026
// pasan por los servicios y la UI para verificar que el parseo funciona con el formato real.
import { describe, expect, it } from 'vitest';
import { CitySearchForm } from '../src/components/CitySearchForm';
import { ErrorMessage } from '../src/components/ErrorMessage';
import { LoadingIndicator } from '../src/components/LoadingIndicator';
import { WeatherDisplay } from '../src/components/WeatherDisplay';
import { ForecastService } from '../src/services/ForecastService';
import { GeocodingService } from '../src/services/GeocodingService';
import type { HttpResponse } from '../src/types';
import { ERROR_MESSAGES, WeatherController } from '../src/WeatherController';
import real from './fixtures/open-meteo-2026-10-22.json';

const ok = (body: unknown): HttpResponse => ({ ok: true, status: 200, json: async () => body });

describe('contrato con Open-Meteo (respuestas reales)', () => {
  it('Geocoding Arequipa → Coordinates con región y país', async () => {
    const res = await new GeocodingService({ fetch: async () => ok(real.geocoding_arequipa) }).geocode('Arequipa');
    expect(res).toEqual({
      success: true,
      data: { latitude: -16.39899, longitude: -71.53747, cityName: 'Arequipa', region: 'Departamento de Arequipa', country: 'Perú' },
    });
  });

  it('Geocoding sin "results" (ciudad inexistente) → CITY_NOT_FOUND', async () => {
    const res = await new GeocodingService({ fetch: async () => ok(real.geocoding_sin_resultados) }).geocode('Ciudadinexistentexyz');
    expect(res).toEqual({ success: false, error: { type: 'CITY_NOT_FOUND' } });
  });

  it('Forecast Arequipa → WeatherData con los valores crudos', async () => {
    const res = await new ForecastService({ fetch: async () => ok(real.forecast_arequipa) }).getForecast(-16.39899, -71.53747);
    expect(res).toEqual({ success: true, data: { temperature: 16.9, humidity: 43, precipitation: 0 } });
  });

  it('flujo completo con datos reales: «San José» se resuelve a California y lo muestra', async () => {
    document.body.innerHTML = '<div id="s"></div><div id="l"></div><div id="e"></div><div id="d"></div>';
    const g = (id: string) => document.getElementById(id)!;
    let controller!: WeatherController;
    const form = new CitySearchForm(g('s'), (c) => void controller.search(c));
    controller = new WeatherController({
      geocoding: new GeocodingService({ fetch: async () => ok(real.geocoding_san_jose) }),
      forecast: new ForecastService({ fetch: async () => ok(real.forecast_san_jose) }),
      form, display: new WeatherDisplay(g('d')), loading: new LoadingIndicator(g('l')), error: new ErrorMessage(g('e')),
    });
    form.input.value = 'San José';
    form.button.click();
    await new Promise((r) => setTimeout(r, 0));
    const text = g('d').textContent!;
    expect(text).toContain('San José, California, Estados Unidos');
    expect(text).toContain('16.7 °C');
    expect(text).toContain('86 %');
    expect(text).toContain('0.0 mm');
    expect(g('e').textContent).not.toBe(ERROR_MESSAGES.CITY_NOT_FOUND);
  });
});
