import type { WeatherData } from '../types';
import { formatHumidity, formatPrecipitation, formatTemperature } from '../utils/formatters';

export class WeatherDisplay {
  constructor(private readonly root: HTMLElement) {}

  /** Renderiza usando textContent (sin innerHTML) para evitar XSS con nombres de la API. */
  render(apiCityName: string, enteredCityName: string, weather: WeatherData): void {
    this.clear();
    const name = apiCityName.trim() !== '' ? apiCityName : enteredCityName;

    const title = document.createElement('h2');
    title.className = 'city-name';
    title.textContent = name;

    const list = document.createElement('dl');
    const rows: Array<[string, string]> = [
      ['Temperatura', formatTemperature(weather.temperature)],
      ['Humedad', formatHumidity(weather.humidity)],
      ['Precipitación', formatPrecipitation(weather.precipitation)],
    ];
    for (const [label, value] of rows) {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      list.append(dt, dd);
    }
    this.root.append(title, list);
  }

  clear(): void {
    this.root.replaceChildren();
  }
}
