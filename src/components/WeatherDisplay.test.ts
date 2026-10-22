import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatHumidity, formatPrecipitation, formatTemperature } from '../utils/formatters';
import { WeatherDisplay } from './WeatherDisplay';

const num = fc.double({ min: -1000, max: 1000, noNaN: true });

describe('WeatherDisplay', () => {
  // Feature: weather-forecast-app, Propiedad 12: display con todos los campos y unidades
  it('P12: contiene ciudad, °C, % y mm', () => {
    fc.assert(fc.property(fc.record({ temperature: num, humidity: num, precipitation: num }), fc.string({ minLength: 1 }).filter((s) => s.trim() !== ''), (w, city) => {
      const root = document.createElement('div');
      new WeatherDisplay(root).render({ cityName: city, region: '', country: '' }, 'x', w);
      const text = root.textContent!;
      expect(text).toContain(city);
      expect(text).toContain(`${formatTemperature(w.temperature)}`);
      expect(text).toContain(`${formatHumidity(w.humidity)}`);
      expect(text).toContain(`${formatPrecipitation(w.precipitation)}`);
      expect(text).toMatch(/°C/); expect(text).toMatch(/%/); expect(text).toMatch(/mm/);
    }));
  });

  it('v1.1: muestra la etiqueta «ciudad, región, país» (Req 4.9)', () => {
    const root = document.createElement('div');
    new WeatherDisplay(root).render({ cityName: 'Arequipa', region: 'Departamento de Arequipa', country: 'Perú' }, 'arequipa', { temperature: 16.9, humidity: 43, precipitation: 0 });
    expect(root.querySelector('.city-name')!.textContent).toBe('Arequipa, Departamento de Arequipa, Perú');
  });

  it('usa el nombre ingresado si la API no devuelve nombre', () => {
    const root = document.createElement('div');
    new WeatherDisplay(root).render({ cityName: '', region: '', country: '' }, 'Mollendo', { temperature: 1, humidity: 2, precipitation: 3 });
    expect(root.querySelector('.city-name')!.textContent).toBe('Mollendo');
  });
  it('clear() vacía el contenido', () => {
    const root = document.createElement('div');
    const d = new WeatherDisplay(root);
    d.render({ cityName: 'A', region: '', country: '' }, 'A', { temperature: 1, humidity: 2, precipitation: 3 });
    d.clear();
    expect(root.textContent).toBe('');
  });
  it('no interpreta HTML del nombre (anti-XSS)', () => {
    const root = document.createElement('div');
    new WeatherDisplay(root).render({ cityName: '<img src=x onerror=alert(1)>', region: '', country: '' }, 'x', { temperature: 1, humidity: 2, precipitation: 3 });
    expect(root.querySelector('img')).toBeNull();
  });
});
