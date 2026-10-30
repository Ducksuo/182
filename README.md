# Plan 182

App web para el móvil con un plan de 182 días en formato checklist. Cada día muestra:

- Desayuno, comida y cena, con cantidades, kcal y proteína
- Objetivo de pasos
- Entrenamiento de 4 ejercicios con mancuernas y banco (o descanso)
- Hábitos: agua, sueño, verdura y sin alcohol
- Control de peso, cintura y fotos en los días que toca
- Consejo del día y notas

También incluye un **calendario** de los 6 meses: check verde (día completo), círculo naranja (60% o más) o X roja (menos del 60%). Además tiene una pestaña de **progreso** (gráfica de peso y rachas) y otra con el **plan completo** (menús por fase, lista de la compra, rutina y reglas de ajuste).

## Privacidad

El código no contiene datos personales. La fecha de inicio, los checks, los pesos y las notas se guardan **solo en el navegador del dispositivo** (`localStorage`). No se envían a ningún servidor.

Como los datos viven en el navegador, exporta una copia de vez en cuando desde **Ajustes → Exportar copia**. Así no los pierdes si borras los datos del navegador o cambias de móvil.

## Publicarla con GitHub Pages

1. Crea un repositorio en GitHub y sube todos los archivos de esta carpeta.
2. Ve a **Settings → Pages**, elige la rama `main` y la carpeta `/ (root)`, y guarda.
3. Al cabo de un minuto la app estará en `https://<tu-usuario>.github.io/<repositorio>/`.

## Instalarla en el móvil

- **iPhone (Safari):** abre la URL, pulsa Compartir y elige **Añadir a pantalla de inicio**.
- **Android (Chrome):** abre la URL, abre el menú ⋮ y elige **Instalar app** o **Añadir a pantalla de inicio**.

Una vez abierta, funciona sin conexión.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `index.html` | Estructura y estilos |
| `app.js` | Lógica de la app: checklist, calendario, progreso y ajustes |
| `plan-data.js` | Datos del plan: alimentos, menús, fases, rutina y consejos |
| `sw.js` | Service worker para el uso sin conexión |
| `manifest.webmanifest`, `icons/` | Instalación como app |

Para cambiar el plan (kcal por fase, alimentos o ejercicios), edita `plan-data.js`. Las cantidades se recalculan solas.

Para probarla en local: `python3 -m http.server` en esta carpeta y abre `http://localhost:8000`.

---

Plan orientativo calculado con fórmulas estándar. No sustituye a un médico o dietista-nutricionista.
