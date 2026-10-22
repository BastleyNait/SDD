---
inclusion: always
---
# Producto: weather-forecast-app

- **Propósito:** permitir a cualquier persona consultar el clima actual (temperatura, humedad, precipitación) de una ciudad escribiendo solo su nombre.
- **Usuario objetivo:** usuario final sin conocimientos técnicos, en español; uso desde navegador de escritorio o móvil.
- **Fuentes de datos:** Open-Meteo Geocoding API y Forecast API (gratuitas, sin API key, con CORS).
- **Principios de producto:**
  - Mensajes de error claros, en español, que indiquen qué falló y permitan reintentar.
  - Nunca mostrar datos de una búsqueda anterior como si fueran de la actual.
  - Mostrar la ubicación resuelta (ciudad, región, país) para que el usuario confirme que es la ciudad que buscaba.
- **Fuera de alcance:** pronóstico de varios días, autenticación, backend propio, persistencia.
