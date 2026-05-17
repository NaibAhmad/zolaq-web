import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> & {
  options: ReadonlyArray<SelectOption>;
  label?: ReactNode;
  helpText?: ReactNode;
  error?: ReactNode;
  placeholderOption?: string;
  className?: string;
  selectClassName?: string;
};

const BASE =
  "h-11 w-full rounded-[var(--radius)] border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";
const STATE_OK =
  "border-border focus:border-accent-blue focus:ring-accent-blue/20";
const STATE_ERR =
  "border-danger/60 focus:border-danger focus:ring-danger/20";

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  {
    options,
    label,
    helpText,
    error,
    placeholderOption,
    className = "",
    selectClassName = "",
    id,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const describedById = helpText || error ? `${selectId}-desc` : undefined;
  const stateClasses = error ? STATE_ERR : STATE_OK;

  return (
    <div className={`flex flex-col gap-1.5 text-sm ${className}`}>
      {label ? (
        <label
          htmlFor={selectId}
          className="text-xs font-medium uppercase tracking-wide text-foreground-muted"
        >
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        className={`${BASE} ${stateClasses} ${selectClassName}`.trim()}
        {...rest}
      >
        {placeholderOption !== undefined ? (
          <option value="">{placeholderOption}</option>
        ) : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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
