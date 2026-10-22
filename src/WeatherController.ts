import type { CitySearchForm } from './components/CitySearchForm';
import type { ErrorMessage } from './components/ErrorMessage';
import type { LoadingIndicator } from './components/LoadingIndicator';
import type { WeatherDisplay } from './components/WeatherDisplay';
import type { ForecastService } from './services/ForecastService';
import type { GeocodingService } from './services/GeocodingService';
import type { AppState, ForecastError, GeocodingError } from './types';

export const ERROR_MESSAGES = {
  CITY_NOT_FOUND: 'No se encontró la ciudad ingresada. Verifica el nombre e intenta de nuevo.',
  GEOCODING_NETWORK_ERROR: 'El servicio de geocodificación no está disponible. Verifica tu conexión.',
  GEOCODING_TIMEOUT: 'El servicio de geocodificación no respondió a tiempo.',
  GEOCODING_SERVICE_ERROR: 'El servicio de geocodificación retornó un error.',
  GEOCODING_INVALID_RESPONSE: 'Los datos recibidos del servicio de geocodificación no son válidos.',
  FORECAST_NETWORK_ERROR: 'El servicio de pronóstico no está disponible. Verifica tu conexión.',
  FORECAST_TIMEOUT: 'El servicio de pronóstico no respondió a tiempo.',
  FORECAST_SERVICE_ERROR: 'El servicio de pronóstico retornó un error.',
  FORECAST_INCOMPLETE_DATA: 'Los datos meteorológicos recibidos están incompletos.',
  FORECAST_INVALID_RESPONSE: 'Los datos recibidos del servicio de pronóstico no son válidos.',
} as const;

export function geocodingMessage(e: GeocodingError): string {
  switch (e.type) {
    case 'CITY_NOT_FOUND': return ERROR_MESSAGES.CITY_NOT_FOUND;
    case 'NETWORK_ERROR': return ERROR_MESSAGES.GEOCODING_NETWORK_ERROR;
    case 'TIMEOUT': return ERROR_MESSAGES.GEOCODING_TIMEOUT;
    case 'SERVICE_ERROR': return ERROR_MESSAGES.GEOCODING_SERVICE_ERROR;
    case 'INVALID_RESPONSE': return ERROR_MESSAGES.GEOCODING_INVALID_RESPONSE;
  }
}

export function forecastMessage(e: ForecastError): string {
  switch (e.type) {
    case 'NETWORK_ERROR': return ERROR_MESSAGES.FORECAST_NETWORK_ERROR;
    case 'TIMEOUT': return ERROR_MESSAGES.FORECAST_TIMEOUT;
    case 'SERVICE_ERROR': return ERROR_MESSAGES.FORECAST_SERVICE_ERROR;
    case 'INCOMPLETE_DATA': return ERROR_MESSAGES.FORECAST_INCOMPLETE_DATA;
    case 'INVALID_RESPONSE': return ERROR_MESSAGES.FORECAST_INVALID_RESPONSE;
  }
}

export interface ControllerDeps {
  geocoding: Pick<GeocodingService, 'geocode'>;
  forecast: Pick<ForecastService, 'getForecast'>;
  form: Pick<CitySearchForm, 'focus'>;
  display: Pick<WeatherDisplay, 'render' | 'clear'>;
  loading: Pick<LoadingIndicator, 'show' | 'hide'>;
  error: Pick<ErrorMessage, 'show' | 'clear'>;
}

export class WeatherController {
  state: AppState = { status: 'idle' };
  private searchId = 0;

  constructor(private readonly d: ControllerDeps) {}

  async search(cityName: string): Promise<void> {
    const id = ++this.searchId;
    const stale = () => id !== this.searchId;

    // Limpieza de estado previo antes de cualquier solicitud (Req. 4.6)
    this.d.display.clear();
    this.d.error.clear();
    this.d.loading.show();
    this.state = { status: 'loading' };

    try {
      const geo = await this.d.geocoding.geocode(cityName);
      if (stale()) return;
      if (!geo.success) return this.fail(geocodingMessage(geo.error));

      const fc = await this.d.forecast.getForecast(geo.data.latitude, geo.data.longitude);
      if (stale()) return;
      if (!fc.success) return this.fail(forecastMessage(fc.error));

      this.d.display.render(geo.data, cityName, fc.data);
      this.state = {
        status: 'success',
        cityName: geo.data.cityName.trim() !== '' ? geo.data.cityName : cityName,
        weather: fc.data,
      };
      this.d.loading.hide();
    } catch {
      if (!stale()) this.fail(ERROR_MESSAGES.FORECAST_NETWORK_ERROR);
    }
  }

  private fail(message: string): void {
    this.d.loading.hide();
    this.d.error.show(message);
    this.state = { status: 'error', message };
    this.d.form.focus(); // City_Input permanece accesible
  }
}
