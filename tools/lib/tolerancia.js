// Tolerancia para comparar un valor calculado con el guardado por el VB6: media unidad del último decimal de la máscara (antes había 5 copias distintas).
// La comparación EXACTA es reglas.aTextoGuardado (api/src/modules/gpi/formula/reglas.js); esta tolerancia queda solo para análisis exploratorios.
const tolerancia = (decimales, valorGuardado = 0) => 0.5 * 10 ** -decimales + 1e-9 + Math.abs(valorGuardado) * 1e-12;
module.exports = { tolerancia };
