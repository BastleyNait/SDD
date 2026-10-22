# weather-forecast-app (SDD)

SPA de pronóstico del clima (temperatura, humedad, precipitación) construida con **Spec-Driven Development**:
los specs (`requirements.md` → `design.md` → `tasks.md`, formato Kiro) están en `.kiro/specs/weather-forecast-app/` y el código se implementó siguiendo `tasks.md`.

- APIs: Open-Meteo Geocoding + Forecast (sin API key, sin backend).
- Stack: TypeScript estricto, Vite, Vitest, fast-check (property-based), jsdom + Testing Library.

## Uso
```bash
npm install
npm run dev      # servidor de desarrollo
npm test         # 39 pruebas (unitarias, propiedades P1–P13, integración)
npm run build    # typecheck + build estático en dist/
```

## Estructura
`src/clients` (HTTP + timeout 10 s) → `src/services` (validación/errores) → `src/WeatherController.ts` (orquestador) → `src/components` (UI).
Trazabilidad requisitos ↔ propiedades ↔ pruebas: ver el informe del laboratorio.
