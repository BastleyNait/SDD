---
inclusion: always
---
# Stack y reglas técnicas

- **Lenguaje:** TypeScript en modo `strict`; sin frameworks de UI (DOM vanilla).
- **Build/dev:** Vite. **Pruebas:** Vitest + jsdom, fast-check (propiedades, ≥100 iteraciones), @testing-library/dom.
- **Reglas obligatorias:**
  - Toda llamada HTTP pasa por un cliente con timeout de 10 s (`AbortController`).
  - Los servicios devuelven uniones discriminadas `{ success, data | error }`; no se lanzan excepciones hacia la UI.
  - Los datos de la API se almacenan sin transformar; el formateo ocurre solo en la capa de presentación.
  - Renderizar texto con `textContent`, nunca `innerHTML` (anti-XSS).
  - Cada criterio de aceptación nuevo debe tener al menos una prueba que lo referencie (`Valida: Req X.Y`).
- **Comandos:** `npm test`, `npm run typecheck`, `npm run build`, `npm run coverage`.
