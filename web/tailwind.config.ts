import type { Config } from "tailwindcss";

// Sistema visual de lab-app. Los colores son variables CSS (src/tema.css) con un valor claro y otro oscuro (clase `dark` en <html>),
// así que una misma clase (bg-surface, text-muted…) sirve para los dos temas. Reglas de uso y contraste en docs/ui-sistema-visual.md.
const v = (nombre: string) => `rgb(var(--${nombre}) / <alpha-value>)`;
const escala = (base: string, pasos: number[]) => Object.fromEntries(pasos.map((p) => [p, v(`${base}-${p}`)]));

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Marca (azul AZPA, matiz 264). Principal = 800; hover = 900; selección = 100; acento suave = 50. `link` = azul de texto legible en cada tema.
        brand: escala("brand", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        link: v("link"),
        // Neutros con rol fijo.
        canvas: v("canvas"), // fondo general
        surface: v("surface"), // paneles, campos
        ink: v("ink"), // texto principal
        muted: v("muted"), // texto secundario
        line: v("line"), // separadores y bordes de panel
        control: v("control"), // borde de campos
        // Estado.
        info: v("info"),
        success: v("success"),
        warning: v("warning"), // solo íconos y detalles
        danger: v("danger"),
        // Identificador de variables calculadas del GPI.
        calc: v("calc"),
        // Las escalas de uso general que la app emplea también cambian con el tema.
        slate: escala("slate", [50, 100, 200, 300, 400, 500, 600, 700, 900]),
        red: escala("red", [50, 200, 700, 800]),
        green: escala("green", [50, 100, 200, 900]),
        amber: escala("amber", [50, 100, 200, 600, 900]),
        blue: escala("blue", [50, 100, 200, 800, 900]),
        yellow: escala("yellow", [200]),
      },
      fontFamily: {
        sans: ['"Inter"', '"Segoe UI"', "system-ui", "-apple-system", '"Helvetica Neue"', "Arial", "sans-serif"],
        // Solo títulos de página (.page-title). Autoalojada: la intranet puede bloquear Google Fonts.
        display: ['"Space Grotesk"', '"Inter"', '"Segoe UI"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
