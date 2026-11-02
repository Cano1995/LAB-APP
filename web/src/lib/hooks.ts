import { useEffect, useState } from "react";

/** Devuelve `valor` recién cuando dejó de cambiar durante `ms`: evita un pedido a la API por cada tecla escrita en un buscador. */
export function useRetardo<T>(valor: T, ms = 300): T {
  const [retardado, setRetardado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setRetardado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return retardado;
}
