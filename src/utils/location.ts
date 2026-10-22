/**
 * Construye el Location_Label «ciudad, región, país» (Req 4.9, Propiedad 14).
 * Omite partes vacías y la región cuando es idéntica al nombre de la ciudad.
 */
export function formatLocation(cityName: string, region: string, country: string): string {
  const parts = [cityName];
  if (region.trim() !== '' && region !== cityName) parts.push(region);
  if (country.trim() !== '') parts.push(country);
  return parts.join(', ');
}
