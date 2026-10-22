# weather-forecast-app — Spec-Driven Development (SDD)

SPA que muestra el clima actual (temperatura, humedad, precipitación) de una ciudad usando Open-Meteo.
El proyecto se desarrolló con **Spec-Driven Development** al estilo Kiro: la especificación es la fuente de verdad
y cada cambio pasa primero por el spec, luego por las pruebas (rojo) y por último por el código (verde).

**Demo en vivo:** https://raw.githack.com/BastleyNait/SDD/main/demo/index.html

## Artefactos SDD

| Artefacto | Ruta | Contenido |
|---|---|---|
| Steering | `.kiro/steering/` | `product.md`, `tech.md`, `structure.md`: reglas permanentes |
| Requisitos | `.kiro/specs/weather-forecast-app/requirements.md` | Historias de usuario + criterios EARS (v1.2) |
| Diseño | `.kiro/specs/weather-forecast-app/design.md` | Arquitectura, interfaces, errores, 16 propiedades de corrección |
| Tareas | `.kiro/specs/weather-forecast-app/tasks.md` | 14 tareas trazadas a requisitos, olas de dependencias, checkpoints |

## Historia del spec

| Versión | Qué cambió | Origen |
|---|---|---|
| 1.0 | Spec inicial (Kiro) → implementación tareas 1–12 | Caso de estudio |
| 1.1 | `language=es`, `relative_humidity_2m`, Req 4.8 respuestas obsoletas, Req 4.9 país/región | Revisión del spec aprobada por el usuario |
| 1.2 | Req 1.7: al fallar la validación se oculta el error previo | Defecto hallado en prueba en vivo; decisión del usuario |

Cada versión quedó en commits separados `docs(spec)` → `test (ROJO)` → `feat (VERDE)`: ver `git log`.

## Uso
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 50 pruebas: unitarias, propiedades P1–P16, integración y contrato
npm run coverage   # cobertura v8 (≈93 % sentencias)
npm run build      # typecheck + build estático en dist/
```

## Estructura
`src/clients` (HTTP + timeout 10 s) → `src/services` (validación/errores) → `src/WeatherController.ts` (orquestador) → `src/components` (UI).
`tests/fixtures/` contiene respuestas reales de Open-Meteo usadas en las pruebas de contrato.

Stack: TypeScript estricto · Vite · Vitest + jsdom · fast-check · Testing Library.
