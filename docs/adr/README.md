# Architecture Decision Records (ADRs)

Este directorio contiene registros de decisiones arquitectónicas importantes tomadas en este proyecto.

## ADR-001: Uso de Astro como framework base

**Estado:** Aceptada

**Contexto:** Necesitábamos un framework que generara sitios estáticos rápidos, con soporte para islands architecture y Content Layer para gestionar posts de blog.

**Decisión:** Elegimos Astro por su enfoque de "zero-JS by default", Content Layer con schemas Zod, y soporte nativo para MDX.

**Consecuencias:**
- ✅ Carga inicial extremadamente rápida
- ✅ Fácil integración de componentes de otros frameworks (Angular islands)
- ⚠️ Curva de aprendizaje para el Content Layer

## ADR-002: Design System con Web Components

**Estado:** Aceptada

**Contexto:** Queríamos consistencia visual entre el blog y el portfolio, con componentes reutilizables framework-agnostic.

**Decisión:** Creamos `@andersseen/web-components` como librería de Web Components standalone, usada tanto en el portfolio como en el blog.

**Consecuencias:**
- ✅ Componentes usables en cualquier framework
- ✅ Consistencia visual cross-project
- ⚠️ Mayor complejidad en registro de iconos y theming

## ADR-003: i18n manual vs. librerías

**Estado:** Aceptada

**Contexto:** Evaluamos `astro-i18next`, `astro-i18n`, y soluciones manuales.

**Decisión:** Implementamos i18n manual con JSONs, routing estático, y helpers de path.

**Consecuencias:**
- ✅ Control total sobre URLs y slugs
- ✅ Sin dependencias externas pesadas
- ⚠️ Más boilerplate para añadir idiomas

## ADR-004: Persistencia de tema en IndexedDB + localStorage

**Estado:** Aceptada

**Contexto:** Necesitábamos persistencia robusta de preferencias de tema, con anti-FOUC.

**Decisión:** localStorage para lectura síncrona anti-FOUC, IndexedDB (Dexie) para persistencia robusta y futura escalabilidad.

**Consecuencias:**
- ✅ Sin flash de tema incorrecto
- ✅ Base de datos estructurada para futuras preferencias
- ⚠️ Lógica más compleja que solo localStorage

## ADR-005: Integración dual de contenido (local + Medium RSS)

**Estado:** Aceptada

**Contexto:** Queremos publicar tanto posts originales como contenido de Medium.

**Decisión:** Content Layer con dos colecciones (`blog` para local, `medium` para RSS), unificadas en un tipo `UnifiedPost`.

**Consecuencias:**
- ✅ Fuente única de verdad para la UI
- ✅ Posts locales con tipado estricto via Zod
- ⚠️ Dependency en disponibilidad del RSS de Medium en build time

## ADR-006: Testing con Vitest + Playwright

**Estado:** Aceptada

**Contexto:** Necesitábamos testing unitario para lógica pura y E2E para flujos críticos.

**Decisión:** Vitest para unit tests (rápido, Vite-native), Playwright para E2E (navegadores reales, accesibilidad).

**Consecuencias:**
- ✅ Tests unitarios rápidos para i18n, theming, layouts
- ✅ E2E robusto con accesibilidad via @axe-core/playwright
- ⚠️ Configuración de CI más compleja
