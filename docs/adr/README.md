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

**Estado:** Superseded por ADR-007 (2026-09-18)

**Contexto:** Evaluamos `astro-i18next`, `astro-i18n`, y soluciones manuales.

**Decisión:** Implementamos i18n manual con JSONs, routing estático, y helpers de path.

**Consecuencias:**
- ✅ Control total sobre URLs y slugs
- ✅ Sin dependencias externas pesadas
- ⚠️ Más boilerplate para añadir idiomas
- ⚠️ (Motivo de la superación) Sin garantías de tipado entre catálogos, sin
  interpolación de mensajes, y el mapeo `ua` → `uk` vivía solo en dos helpers
  ad hoc — ver ADR-007.

## ADR-007: Migración a routing i18n nativo de Astro + @etyma/astro

**Estado:** Aceptada (2026-09-18)

**Contexto:** `@etyma/astro` (paquete propio, entonces pre-release) llegó a un punto en
el que podía dogfoodearse en un proyecto real. My Blog fue el primer consumidor
real: se desarrolló contra tarballs empaquetados (`.tgz`) de `@etyma/core`/`@etyma/astro`
antes de su primer release público, y hoy consume las versiones publicadas en npm
(`@etyma/astro` ^0.1.1).

**Decisión:** Astro pasa a ser dueño del routing i18n (`astro.config.mjs`
`i18n` block, con la locale `uk` mapeada al path `ua` vía `{ path, codes }`).
Etyma pasa a ser dueño de los mensajes: catálogos JSON con sintaxis
MessageFormat 2, claves tipadas de punta a punta, y `createAstroI18n(Astro, i18n)`
por render. El árbol de páginas `src/pages/[lang]/...` se reemplazó por
carpetas reales `src/pages/en/...` y `src/pages/ua/...`, ya que el routing
nativo de Astro funciona por carpeta, no por segmento dinámico.

**Consecuencias:**
- ✅ El locale real (`uk`) y el segmento de URL (`ua`) son conceptos distintos
  y explícitos en la config — el bug histórico `hreflang="ua"` deja de ser
  posible por diseño, no por convención.
- ✅ Claves de traducción tipadas (`t('nav.blgo')` no compila); antes
  `Dictionary` se inferí­a del JSON sin ninguna garantía entre locales.
- ✅ `etyma validate` (CLI) reemplaza cualquier test manual de paridad de
  claves entre catálogos.
- ✅ El sitemap ahora emite `xhtml:link` hreflang por URL (antes no tenía
  ninguno).
- ⚠️ Los valores de array en un catálogo (listas de bullets) no son un tipo
  de mensaje válido en Etyma — se reescribieron como claves planas
  numeradas (`home.editorialPoint1..4`). Ver `docs/ai/STATE.md`.
- ✅ El dogfooding encontró dos bugs reales en `@etyma/astro` 0.1.0, ya
  corregidos upstream en 0.1.1: `path()` duplicaba el prefijo de locale si se le
  pasaba un path ya prefijado (ahora lanza error), e importar el paquete fuera
  del pipeline de Vite de Astro fallaba por un import estático de `astro:i18n`
  (ahora es perezoso, así que `src/i18n/index.ts` se puede importar desde Vitest).
- ⚠️ Open Graph (`og:locale`, formato `es_ES`) es un concepto distinto de un
  código de idioma BCP-47 y Etyma no lo cubre a propósito — se mantiene un
  mapeo pequeño y propio en `src/i18n/og-locale.ts`.

### Adenda a ADR-007 (2026-09-18): Glossa como fuente de traducciones y `en` como locale por defecto

**Contexto:** los catálogos JSON locales seguían siendo una fuente de verdad de contenido
dentro del repo. Glossa (`https://glossa.andersseen.dev`, proyecto `my-blog`) pasa a ser el
dueño del contenido de producción, y Etyma ya ofrece `defineRemoteI18n`,
`createHttpMessageLoader` y `etymaRemoteContract` (`@etyma/tooling`).

**Decisión:** Astro sigue siendo dueño del routing; **Glossa** es dueño del contenido de
traducciones; **Etyma** es dueño de carga/tipado/formato; my-blog solo contiene integración y
uso de claves. El sitio sigue siendo 100 % estático: los catálogos se leen de Glossa Public
Delivery **durante el build** y se incrustan en el HTML (sin fetch en el navegador, sin SSR, sin
capa de sync). El contrato de claves (`src/i18n/etyma.generated.ts`, solo claves, commiteado) se
genera desde el catálogo fuente remoto. Se eliminaron `src/i18n/locales/*.json`, `pnpm
i18n:validate` y `@etyma/cli`. Los agentes editan traducciones vía el MCP de Glossa
(`.mcp.json`, token en `GLOSSA_TOKEN`, nunca commiteado).

Además, el locale por defecto pasa de `es` a `en`: el proyecto Glossa tiene `en` como source
locale (no editable tras la creación) y `@etyma/astro` exige que el `sourceLocale` de Etyma sea
la ruta sin prefijo (`defaultLocale` de Astro) y lo usa para `x-default`. Por tanto `/` es
inglés, el español vive en `/es/...` y el ucraniano sigue en `/ua/...` (código `uk`).

**Consecuencias:**
- ✅ No existe una segunda fuente de verdad de producción para las traducciones.
- ✅ `MessageKey` sigue tipado de punta a punta, ahora desde el contrato generado.
- ⚠️ Una edición en Glossa NO cambia el HTML ya desplegado: aparece tras el siguiente build +
  deploy de Cloudflare Pages (push a `main`, dispatch del Worker de Medium o fallback semanal).
- ⚠️ El build de producción depende de Glossa: si no está disponible, **falla** (a propósito;
  no hay copia local obsoleta que oculte el problema). Solo el contrato de claves cae al último
  archivo commiteado.
- ⚠️ Cambio de URLs: las URLs en español (`/`, `/blog/...`) ahora sirven inglés; `/en/*` redirige
  con 301 a `/*` y el español pasa a `/es/*`. Riesgo SEO de reindexación.
- ⚠️ Se pierde la validación local de sintaxis MF2 / placeholders (`etyma validate` solo lee un
  directorio local). Registrado como seguimiento upstream (Etyma/Glossa) en `docs/ai/STATE.md`.
- La bullet "`etyma validate` (CLI) reemplaza…" de ADR-007 queda superada por esta adenda, y el
  árbol `src/pages/en/...` ahora es `src/pages/es/...`.

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
