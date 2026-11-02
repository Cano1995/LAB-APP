import TemaToggle from "@/components/TemaToggle";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { Alert, Button, Field, Input } from "@/components/ui";
import { useMarca } from "@/lib/branding";

// Usuario = el del GATEC; contraseña = la de su usuario de Oracle (la valida la API contra la base).
export default function Login() {
  const { loginOk, aviso } = useAuth();
  const marca = useMarca();
  const alt = [marca.nombre, marca.lema].filter(Boolean).join(" · ");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const r = await api.login(usuario.trim(), senha);
      loginOk(r.token, r.perfil);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="relative flex min-h-full items-center justify-center bg-canvas px-4 py-10">
      <div className="absolute right-4 top-4"><TemaToggle /></div>
      <div className="w-full max-w-sm">
        <div className="panel mb-4 px-6 py-3">
          <img src={marca.img.logo_claro} alt={alt} className="mx-auto h-auto w-full max-w-[14rem] dark:hidden" />
          <img src={marca.img.logo_oscuro} alt={alt} className="mx-auto hidden h-auto w-full max-w-[14rem] dark:block" />
        </div>

        <form onSubmit={onLogin} className="panel space-y-4 p-6">
          <div className="text-center">
            <h1 className="page-title">Ingresar</h1>
          </div>

          {aviso && !error && <Alert tone="warning">{aviso}</Alert>}
          {error && <Alert>{error}</Alert>}

          <Field label="Usuario">
            <Input
              autoFocus
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              spellCheck={false}
            />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
            />
          </Field>

          <Button type="submit" loading={cargando} disabled={!usuario || !senha} className="w-full">
            Ingresar
          </Button>
        </form>
      </div>
    </div>
  );
}
