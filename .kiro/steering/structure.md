---
inclusion: always
---
# Estructura del proyecto

```
.kiro/steering/          reglas permanentes del proyecto (este directorio)
.kiro/specs/<feature>/   requirements.md → design.md → tasks.md
src/types/               tipos del dominio (Coordinates, WeatherData, resultados)
src/clients/             acceso HTTP (URL + timeout), sin lógica de negocio
src/services/            validación, parseo y clasificación de errores
src/utils/               funciones puras (formateo, etiqueta de ubicación)
src/components/          componentes de UI (DOM)
src/WeatherController.ts orquestador de la búsqueda
tests/                   integración y pruebas de contrato con respuestas reales
```

- Pruebas unitarias junto al archivo (`*.test.ts`); integración en `tests/`.
- Nombres de archivos de clases en PascalCase; funciones utilitarias en camelCase.
