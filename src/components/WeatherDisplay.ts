import type { Coordinates, WeatherData } from '../types';
import { formatHumidity, formatPrecipitation, formatTemperature } from '../utils/formatters';
import { formatLocation } from '../utils/location';

export type LocationInfo = Pick<Coordinates, 'cityName' | 'region' | 'country'>;

export class WeatherDisplay {
  constructor(private readonly root: HTMLElement) {}

  /** Renderiza usando textContent (sin innerHTML) para evitar XSS con nombres de la API. */
  render(location: LocationInfo, enteredCityName: string, weather: WeatherData): void {
    this.clear();
    // Req 4.7: si la API no trae nombre, se usa el ingresado por el usuario
    const name = location.cityName.trim() !== '' ? location.cityName : enteredCityName;

    const card = document.createElement('article');
    card.className = 'weather-card';

    const title = document.createElement('h2');
    title.className = 'city-name';
    title.textContent = formatLocation(name, location.region, location.country); // Req 4.9

    const caption = document.createElement('p');
    caption.className = 'caption';
    caption.textContent = 'Condiciones actuales';

    const metrics = document.createElement('dl');
    metrics.className = 'metrics';
    const rows: Array<[string, string, string]> = [
      ['temperature', 'Temperatura', formatTemperature(weather.temperature)],
      ['humidity', 'Humedad', formatHumidity(weather.humidity)],
      ['precipitation', 'Precipitación', formatPrecipitation(weather.precipitation)],
    ];
    for (const [key, label, value] of rows) {
      const box = document.createElement('div');
      box.className = `metric metric-${key}`;
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      box.append(dt, dd);
      metrics.append(box);
    }
    card.append(title, caption, metrics);
    this.root.append(card);
  }

  clear(): void {
    this.root.replaceChildren();
  }
}
