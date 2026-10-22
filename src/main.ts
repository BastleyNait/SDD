import './styles.css';
import { ForecastClient } from './clients/ForecastClient';
import { GeocodingClient } from './clients/GeocodingClient';
import { CitySearchForm } from './components/CitySearchForm';
import { ErrorMessage } from './components/ErrorMessage';
import { LoadingIndicator } from './components/LoadingIndicator';
import { WeatherDisplay } from './components/WeatherDisplay';
import { ForecastService } from './services/ForecastService';
import { GeocodingService } from './services/GeocodingService';
import { WeatherController } from './WeatherController';

const el = (id: string): HTMLElement => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Falta el elemento #${id}`);
  return node;
};

const display = new WeatherDisplay(el('weather-display'));
const loading = new LoadingIndicator(el('loading'));
const error = new ErrorMessage(el('error'));

let controller: WeatherController;
const form = new CitySearchForm(el('search'), (city) => void controller.search(city));
controller = new WeatherController({
  geocoding: new GeocodingService(new GeocodingClient()),
  forecast: new ForecastService(new ForecastClient()),
  form,
  display,
  loading,
  error,
});
form.focus();
