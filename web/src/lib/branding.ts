import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type Marca } from "@/lib/api";

// Valores de fábrica: lo que se ve si la instalación no configuró nada (o mientras carga / si la API no responde).
// Los archivos están en web/public y son genéricos; cada instalación sube los suyos desde Administración → Configuración.
export const MARCA_DEFECTO: Marca = {
  nombre: "Lab App",
  nombre_corto: "Lab App",
  empresa: "",
  lema: "",
  descripcion: "",
  pais: "",
  imagenes: { logo_claro: null, logo_oscuro: null, emblema: null, favicon: null },
};

export const IMAGEN_DEFECTO = {
  logo_claro: "/logo-lab.svg",
  logo_oscuro: "/logo-lab-oscuro.svg",
  emblema: "/emblema-lab.svg",
  favicon: "/favicon.svg",
} as const;

export const QUERY_MARCA = ["marca"] as const;

/** Marca de la instalación (textos + URL de cada imagen ya resuelta, con la de fábrica si no hay una cargada). */
export function useMarca() {
  const { data } = useQuery({ queryKey: QUERY_MARCA, queryFn: api.marca, staleTime: 5 * 60_000, retry: 1 });
  const m = data ?? MARCA_DEFECTO;
  return {
    ...m,
    img: {
      logo_claro: m.imagenes.logo_claro ?? IMAGEN_DEFECTO.logo_claro,
      logo_oscuro: m.imagenes.logo_oscuro ?? m.imagenes.logo_claro ?? IMAGEN_DEFECTO.logo_oscuro,
      emblema: m.imagenes.emblema ?? IMAGEN_DEFECTO.emblema,
      favicon: m.imagenes.favicon ?? IMAGEN_DEFECTO.favicon,
    },
    /** true si el emblema es el de fábrica (monocromo: se invierte en tema oscuro) y no uno subido (que se muestra tal cual). */
    emblemaDeFabrica: !m.imagenes.emblema,
  };
}

/** Aplica la marca a la pestaña del navegador: título y favicon. Se monta una sola vez en la raíz. */
export function useMarcaEnDocumento() {
  const m = useMarca();
  useEffect(() => {
    document.title = m.nombre;
    let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.removeAttribute("type"); // el tipo depende de la imagen (svg, png, ico): que lo detecte el navegador
    link.href = m.img.favicon;
  }, [m.nombre, m.img.favicon]);
}
