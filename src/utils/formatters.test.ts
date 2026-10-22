import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatHumidity, formatPrecipitation, formatTemperature } from './formatters';

const val = fc.double({ min: -1e6, max: 1e6, noNaN: true });

describe('formatters', () => {
  // Feature: weather-forecast-app, Propiedad 11: formateo numérico
  it('P11: temperatura y precipitación con máx. 1 decimal; humedad entera', () => {
    fc.assert(fc.property(val, (v) => {
      for (const s of [formatTemperature(v), formatPrecipitation(v)]) {
        const num = s.split(' ')[0];
        const dec = num.split('.')[1] ?? '';
        expect(dec.length).toBeLessThanOrEqual(1);
      }
      expect(formatHumidity(v).split(' ')[0]).not.toContain('.');
    }));
  });
  it('ejemplos del diseño', () => {
    expect(formatTemperature(8.4)).toBe('8.4 °C');
    expect(formatHumidity(72)).toBe('72 %');
    expect(formatPrecipitation(0)).toBe('0.0 mm');
  });
});
