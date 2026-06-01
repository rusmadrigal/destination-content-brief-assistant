import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, InputHTMLAttributes } from "react";
import type { SelectOption } from "@/lib/briefs/types";

interface FieldShellProps {
  id: string;
  label: string;
  helperText?: string;
  required?: boolean;
  error?: string;
  warning?: string;
  children: ReactNode;
}

function FieldShell({ id, label, helperText, required, error, warning, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-200">
        {label}
        {required && <span className="ml-0.5 text-ai-fuchsia-400">*</span>}
      </label>
      {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      {children}
      {error && (
        <p className="text-xs font-medium text-rose-400" role="alert">
          {error}
        </p>
      )}
      {!error && warning && (
        <p className="text-xs font-medium text-amber-400/90" role="status">
          {warning}
        </p>
      )}
    </div>
  );
}

const controlBase =
  "w-full rounded-xl border bg-white/[0.03] px-3 py-2.5 text-sm text-slate-100 shadow-inner transition-all placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-ai-violet-500/40 focus:border-ai-violet-500/50 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50";

function controlBorder(error?: string): string {
  return error
    ? "border-rose-500/50 focus:border-rose-400 focus:ring-rose-500/30"
    : "border-white/10 hover:border-white/15";
}

type TextFieldProps = {
  id: string;
  label: string;
  helperText?: string;
  required?: boolean;
  error?: string;
  warning?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ id, label, helperText, required, error, warning, ...rest }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} helperText={helperText} required={required} error={error} warning={warning}>
      <input id={id} className={`${controlBase} ${controlBorder(error)}`} {...rest} />
    </FieldShell>
  );
}

type TextAreaFieldProps = {
  id: string;
  label: string;
  helperText?: string;
  required?: boolean;
  error?: string;
  warning?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({
  id,
  label,
  helperText,
  required,
  error,
  warning,
  rows = 4,
  ...rest
}: TextAreaFieldProps) {
  return (
    <FieldShell id={id} label={label} helperText={helperText} required={required} error={error} warning={warning}>
      <textarea id={id} rows={rows} className={`${controlBase} ${controlBorder(error)} resize-y`} {...rest} />
    </FieldShell>
  );
}

type SelectFieldProps<T extends string> = {
  id: string;
  label: string;
  helperText?: string;
  required?: boolean;
  error?: string;
  options: SelectOption<T>[];
  placeholder?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "children">;

export function SelectField<T extends string>({
  id,
  label,
  helperText,
  required,
  error,
  options,
  placeholder = "Select an option…",
  ...rest
}: SelectFieldProps<T>) {
  return (
    <FieldShell id={id} label={label} helperText={helperText} required={required} error={error}>
      <select id={id} className={`${controlBase} ${controlBorder(error)} cursor-pointer`} {...rest}>
        <option value="" className="bg-surface-800 text-slate-300">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface-800 text-slate-100">
            {opt.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
