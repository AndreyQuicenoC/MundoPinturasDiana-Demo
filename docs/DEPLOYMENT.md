# Despliegue — Demo Mundo Pinturas Diana

## Figma Make (recomendado)

1. Abrir el proyecto en Figma Make.
2. **Publish** ejecuta `.figma/make/deploy` (build Payload + Next standalone).
3. Verificar rutas: `figma make verify-deploy`.
4. Probar:
   - Sitio público `/`, `/catalogo`, `/sedes`.
   - `/login` con usuarios demo.
   - Panel admin/gerente: inventario, analítica (procesar + PDF), POS.

Variables de entorno backend las inyecta la plataforma; no commitear `.env`.

## Datos de ejemplo

Con Payload conectado en el entorno Make:

```bash
pnpm seed:demo-analytics
```

Genera ventas, gastos y eventos de sitio distribuidos por mes (idempotente si ya hay ≥200 ventas).

## GitHub (espejo)

Este repositorio puede desplegarse fuera de Make solo con backend Payload/Figma configurado; sin credenciales de plataforma el build local fallará en Payload — es esperado.

## Smoke test post-deploy

| # | Caso | Resultado esperado |
|---|------|-------------------|
| 1 | Login admin | Panel completo |
| 2 | Analítica sin procesar | KPIs en 0 |
| 3 | Procesar analítica | Gráficos con datos |
| 4 | Descargar PDF | Archivo PDF válido |
| 5 | Entrada inventario bulk | Kardex actualizado |
| 6 | Catálogo público | Imágenes con dimensiones |
