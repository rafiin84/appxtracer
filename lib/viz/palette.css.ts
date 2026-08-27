import { CATEGORICAL_DARK, CATEGORICAL_LIGHT } from "./palette";

/**
 * The series slots as CSS custom properties, injected once at the app root so
 * charts are written against roles (`var(--series-3)`) rather than raw hex, and
 * both modes swap in one place.
 */
export const seriesCssVariables = `
:root {
${CATEGORICAL_LIGHT.map((hex, i) => `  --series-${i + 1}: ${hex};`).join("\n")}
}
.dark {
${CATEGORICAL_DARK.map((hex, i) => `  --series-${i + 1}: ${hex};`).join("\n")}
}
`.trim();
