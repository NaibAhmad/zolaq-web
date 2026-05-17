import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label?: ReactNode;
  helpText?: ReactNode;
  error?: ReactNode;
  className?: string;
  inputClassName?: string;
};

const BASE_INPUT =
  "h-11 w-full rounded-[var(--radius)] border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";
const STATE_OK =
  "border-border focus:border-accent-blue focus:ring-accent-blue/20";
const STATE_ERR =
  "border-danger/60 focus:border-danger focus:ring-danger/20";

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  {
    label,
    helpText,
    error,
    className = "",
    inputClassName = "",
    id,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedById = helpText || error ? `${inputId}-desc` : undefined;
  const stateClasses = error ? STATE_ERR : STATE_OK;

  return (
    <div className={`flex flex-col gap-1.5 text-sm ${className}`}>
      {label ? (
        <label
          htmlFor={inputId}
          className="text-xs font-medium uppercase tracking-wide text-foreground-muted"
        >
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        className={`${BASE_INPUT} ${stateClasses} ${inputClassName}`.trim()}
        {...rest}
      />
      {error ? (
        <p id={describedById} className="text-xs text-danger">
          {error}
        </p>
      ) : helpText ? (
        <p id={describedById} className="text-xs text-foreground-muted">
          {helpText}
        </p>
      ) : null}
    </div>
  );
});
