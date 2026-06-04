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
      <label htmlFor={id} className="text-sm font-medium text-granicus-navy">
        {label}
        {required && <span className="ml-0.5 text-granicus-red">*</span>}
      </label>
      {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      {children}
      {error && (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
      {!error && warning && (
        <p className="text-xs font-medium text-amber-700" role="status">
          {warning}
        </p>
      )}
    </div>
  );
}

const controlBase =
  "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-granicus-navy shadow-sm transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-granicus-red/25 focus:border-granicus-red/40 disabled:cursor-not-allowed disabled:opacity-50";

function controlBorder(error?: string): string {
  return error
    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
    : "border-slate-200 hover:border-slate-300";
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
        <option value="" className="bg-white text-slate-600">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-granicus-navy">
            {opt.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
