import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, ApiError, registrarSesionVencida, tokenStore, type Contexto, type Perfil } from "@/lib/api";

interface AuthState {
  perfil: Perfil | null;
  cargando: boolean;
  /** Mensaje para el login cuando la sesión terminó sin que el usuario la cerrara (p. ej. venció). */
  aviso: string | null;
  /** El servidor no respondió al validar la sesión guardada: se puede reintentar sin volver a ingresar. */
  errorInicio: string | null;
  reintentarInicio: () => void;
  loginOk: (token: string, perfil: Perfil) => void;
  setContexto: (c: Contexto) => void;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [errorInicio, setErrorInicio] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  // La caché de react-query no distingue usuarios: al entrar o salir se vacía para que nadie vea, ni un instante, datos de otra persona.
  const cerrarSesion = useCallback((mensaje: string | null) => {
    tokenStore.clear();
    qc.clear();
    setPerfil(null);
    setAviso(mensaje);
  }, [qc]);

  useEffect(() => {
    registrarSesionVencida(() => cerrarSesion("Su sesión venció. Ingrese nuevamente."));
    return () => registrarSesionVencida(null);
  }, [cerrarSesion]);

  useEffect(() => {
    if (!tokenStore.get()) {
      setCargando(false);
      return;
    }
    setCargando(true);
    setErrorInicio(null);
    api
      .me()
      .then((r) => setPerfil(r.perfil))
      .catch((e) => {
        // Solo un 401 invalida el token. Una caída del servidor o de la red no debe sacar al usuario: se ofrece reintentar.
        if (e instanceof ApiError && e.status === 401) tokenStore.clear();
        else setErrorInicio(e instanceof Error ? e.message : "No se pudo validar la sesión");
      })
      .finally(() => setCargando(false));
  }, [intento]);

  const loginOk = useCallback((token: string, p: Perfil) => {
    qc.clear();
    tokenStore.set(token);
    setAviso(null);
    setPerfil(p);
  }, [qc]);
  const setContexto = useCallback((c: Contexto) => setPerfil((p) => (p ? { ...p, contexto: c } : p)), []);
  const logout = useCallback(() => cerrarSesion(null), [cerrarSesion]);
  const reintentarInicio = useCallback(() => setIntento((n) => n + 1), []);

  // Valor estable: antes se recreaba en cada render y re-renderizaba a todos los consumidores.
  const valor = useMemo(
    () => ({ perfil, cargando, aviso, errorInicio, reintentarInicio, loginOk, setContexto, logout }),
    [perfil, cargando, aviso, errorInicio, reintentarInicio, loginOk, setContexto, logout],
  );
  return <AuthCtx.Provider value={valor}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth fuera de AuthProvider");
  return ctx;
}
