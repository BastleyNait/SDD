import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatLocation } from './location';

describe('formatLocation (v1.1)', () => {
  // Feature: weather-forecast-app, Propiedad 14: etiqueta de ubicación — Valida: Req 4.9
  it('P14: ciudad primero, región/país solo si aportan, sin separadores vacíos', () => {
    const part = fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim() !== '' && !s.includes(',')));
    fc.assert(fc.property(part.filter((s) => s !== ''), part, part, fc.boolean(), (city, region0, country, sameAsCity) => {
      const region = sameAsCity ? city : region0;
      const label = formatLocation(city, region, country);
      const parts = label.split(', ');
      expect(parts[0]).toBe(city);
      expect(parts.every((p) => p !== '')).toBe(true);
      const expected = [city];
      if (region !== '' && region !== city) expected.push(region);
      if (country !== '') expected.push(country);
      expect(parts).toEqual(expected);
    }));
  });

  it('ejemplos con datos reales de Open-Meteo', () => {
    expect(formatLocation('Arequipa', 'Departamento de Arequipa', 'Perú')).toBe('Arequipa, Departamento de Arequipa, Perú');
    expect(formatLocation('San José', 'California', 'Estados Unidos')).toBe('San José, California, Estados Unidos');
    expect(formatLocation('Lima', 'Lima', 'Perú')).toBe('Lima, Perú');
    expect(formatLocation('Mollendo', '', '')).toBe('Mollendo');
  });
});
