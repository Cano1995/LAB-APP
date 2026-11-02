// Exportación a CSV común a todas las pantallas (F7, Sprint 12). Separador «;», coma decimal y BOM, para que Excel en español lo abra bien.

// Excel ejecuta como fórmula toda celda que empieza con = + - @ (o tabulación / retorno de carro). Los textos vienen de la base y de usuarios,
// así que se neutralizan con una comilla simple al inicio; un número legítimo (p. ej. -12,5) se deja como está.
const PELIGROSA = /^[=+\-@\t\r]/;
const NUMERO = /^-?\d+([.,]\d+)?$/;

export function celdaCsv(valor: string | number | null | undefined): string {
  let s = valor === null || valor === undefined ? "" : String(valor);
  if (NUMERO.test(s)) s = s.replace(".", ","); // coma decimal
  else if (PELIGROSA.test(s)) s = `'${s}`;
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function textoCsv(filas: (string | number | null | undefined)[][]): string {
  return filas.map((f) => f.map(celdaCsv).join(";")).join("\r\n");
}

export function bajarCsv(nombre: string, filas: (string | number | null | undefined)[][]) {
  const blob = new Blob(["﻿" + textoCsv(filas)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(a.href);
}
