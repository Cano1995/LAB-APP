// Utilidades mínimas compartidas por los servicios (antes cada uno tenía su copia).

/** Error de cliente (por defecto 400) con el mensaje que verá el usuario. */
const error = (msg, status = 400) => Object.assign(new Error(msg), { status });

/** Recorta espacios (las columnas CHAR de Oracle vienen rellenas); lo que no es texto pasa igual. */
const trim = (s) => (typeof s === "string" ? s.trim() : s);

module.exports = { error, trim };
