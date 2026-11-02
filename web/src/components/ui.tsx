import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, Info, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Componentes base. Reglas comunes: controles de 36 px (compactos 32 px), radio de 6 px en controles y de
// 8 px en paneles y modales, borde de campo `control` (3:1), foco con anillo verde, errores en rojo con ícono.

// ---------------------------------------------------------------------------------------------------------------
// Botones
// ---------------------------------------------------------------------------------------------------------------

type Variante = "primary" | "secondary" | "ghost" | "danger";

const VARIANTES: Record<Variante, string> = {
  primary: "bg-brand-800 text-white hover:bg-brand-900 active:bg-brand-950",
  secondary: "border border-control bg-surface text-ink hover:border-muted hover:bg-slate-50 active:bg-slate-100",
  ghost: "text-slate-700 hover:bg-slate-100 active:bg-slate-200",
  danger: "bg-danger text-white hover:brightness-90 active:brightness-75",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variante;
  size?: "md" | "sm";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "h-9 px-4 text-sm" : "h-8 px-3 text-[13px]",
        VARIANTES[variant],
        className
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
);
Button.displayName = "Button";

// Botón de ícono (acciones de fila, cerrar). Siempre con `label`: es el nombre accesible y el tooltip.
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: "neutral" | "danger" }
>(({ label, tone = "neutral", className, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={label}
    title={label}
    className={cn(
      "grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 transition-colors disabled:opacity-50",
      tone === "danger" ? "hover:bg-red-50 hover:text-danger" : "hover:bg-slate-100 hover:text-ink",
      className
    )}
    {...props}
  >
    {children}
  </button>
));
IconButton.displayName = "IconButton";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} aria-hidden />;
}

// ---------------------------------------------------------------------------------------------------------------
// Campos
// ---------------------------------------------------------------------------------------------------------------

const CAMPO = cn(
  "h-9 w-full rounded-md border border-control bg-surface px-3 text-sm text-ink transition-colors",
  "placeholder:text-muted hover:border-muted",
  "focus:border-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-600/30",
  "disabled:cursor-not-allowed disabled:border-line disabled:bg-slate-100 disabled:text-slate-600 disabled:hover:border-line",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/30"
);
const CAMPO_COMPACTO = "h-8 px-2.5 text-[13px]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { compact?: boolean }>(
  ({ className, compact, ...props }, ref) => (
    <input ref={ref} className={cn(CAMPO, compact && CAMPO_COMPACTO, className)} {...props} />
  )
);
Input.displayName = "Input";

export const SearchInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { compact?: boolean }>(
  ({ className, compact, placeholder, ...props }, ref) => (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        aria-hidden
      />
      <Input
        ref={ref}
        compact={compact}
        placeholder={placeholder}
        aria-label={props["aria-label"] ?? placeholder}
        className="pl-8"
        {...props}
      />
    </div>
  )
);
SearchInput.displayName = "SearchInput";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { compact?: boolean }>(
  ({ className, compact, children, ...props }, ref) => (
    <div className="relative inline-block">
      <select ref={ref} className={cn(CAMPO, compact && CAMPO_COMPACTO, "appearance-none pr-8", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        aria-hidden
      />
    </div>
  )
);
Select.displayName = "Select";

export function Checkbox({
  label,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode }) {
  return (
    <label
      className={cn(
        "inline-flex select-none items-center gap-2 text-[13px] text-ink",
        props.disabled && "text-slate-500",
        className
      )}
    >
      <input type="checkbox" className="h-4 w-4 rounded accent-brand-800" {...props} />
      {label}
    </label>
  );
}

export function Field({
  label,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-[13px] font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Estados
// ---------------------------------------------------------------------------------------------------------------

type TonoAlerta = "error" | "info" | "success" | "warning";

const TONOS: Record<TonoAlerta, { caja: string; icono: string; Icon: typeof Info }> = {
  error: { caja: "border-red-200 bg-red-50 text-red-800", icono: "text-danger", Icon: AlertCircle },
  info: { caja: "border-blue-200 bg-blue-50 text-blue-800", icono: "text-info", Icon: Info },
  success: { caja: "border-green-200 bg-green-50 text-green-900", icono: "text-success", Icon: CheckCircle2 },
  warning: { caja: "border-amber-200 bg-amber-50 text-amber-900", icono: "text-amber-600", Icon: AlertTriangle },
};

export function Alert({
  children,
  tone = "error",
  className,
}: {
  children: ReactNode;
  tone?: TonoAlerta;
  className?: string;
}) {
  const { caja, icono, Icon } = TONOS[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-[13px] leading-5", caja, className)}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", icono)} aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const BADGES = {
  neutral: "bg-slate-100 text-slate-700",
  brand: "bg-brand-100 text-link",
  warning: "bg-amber-100 text-amber-900",
  info: "bg-blue-100 text-blue-900",
  success: "bg-green-100 text-green-900",
  danger: "border border-red-200 bg-red-50 text-red-700",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  title,
}: {
  tone?: keyof typeof BADGES;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium",
        BADGES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="px-4 py-10 text-center text-[13px] text-muted">{children}</div>;
}

// ---------------------------------------------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------------------------------------------

const ANCHOS = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

const FOCALIZABLES = "a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function Modal({
  title,
  onClose,
  children,
  size = "md",
  cierreBloqueado = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: keyof typeof ANCHOS;
  /** Mientras es verdadero (p. ej. se está guardando) no se puede cerrar con Esc, el fondo ni la X: se perdería lo escrito. */
  cierreBloqueado?: boolean;
}) {
  const tituloId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const cerrar = useRef(onClose);
  cerrar.current = onClose;
  const bloqueado = useRef(cierreBloqueado);
  bloqueado.current = cierreBloqueado;
  const presionoFondo = useRef(false);
  const intentarCerrar = () => { if (!bloqueado.current) cerrar.current(); };

  // Al abrir: el foco pasa al primer campo (o al panel); Esc cierra; Tab no sale del diálogo; la página de fondo no se desplaza;
  // al cerrar el foco vuelve a donde estaba.
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    const p = panel.current;
    const primero = p?.querySelector<HTMLElement>(
      "input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled])"
    );
    (primero ?? p)?.focus();
    const desbordeAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { intentarCerrar(); return; }
      if (e.key !== "Tab" || !p) return;
      // Trampa de foco: Tab y Mayús+Tab circulan dentro del diálogo.
      const items = [...p.querySelectorAll<HTMLElement>(FOCALIZABLES)].filter((el) => el.offsetParent !== null);
      if (!items.length) { e.preventDefault(); p.focus(); return; }
      const primeroEl = items[0], ultimo = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === primeroEl || document.activeElement === p)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeroEl.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = desbordeAnterior;
      previo?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center"
      // Solo se cierra si el clic EMPEZÓ y TERMINÓ en el fondo: antes, arrastrar el mouse desde un campo hasta fuera del diálogo lo cerraba y se perdía lo escrito.
      onMouseDown={(e) => { presionoFondo.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (presionoFondo.current && e.target === e.currentTarget) intentarCerrar(); presionoFondo.current = false; }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className={cn(
          "flex max-h-[90vh] w-full flex-col rounded-lg border border-line bg-surface shadow-xl outline-none",
          ANCHOS[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line py-2.5 pl-5 pr-3">
          <h2 id={tituloId} className="text-base font-semibold text-ink">
            {title}
          </h2>
          <IconButton label="Cerrar" onClick={intentarCerrar} disabled={cierreBloqueado}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// Fila de acciones al pie de un formulario o diálogo.
export function FormActions({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">{children}</div>;
}

/** Dato destacado (rótulo chico arriba, valor grande abajo) de los resúmenes de las pantallas. */
export function Dato({ t, v, alerta }: { t: string; v: string; alerta?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted">{t}</div>
      <div className={cn("text-[15px] font-semibold tabular-nums", alerta ? "text-red-700" : "text-ink")}>{v}</div>
    </div>
  );
}
