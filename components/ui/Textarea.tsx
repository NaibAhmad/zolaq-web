import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from "react";

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
  label?: ReactNode;
  helpText?: ReactNode;
  error?: ReactNode;
  className?: string;
  textareaClassName?: string;
};

const BASE =
  "w-full rounded-[var(--radius)] border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";
const STATE_OK =
  "border-border focus:border-accent-blue focus:ring-accent-blue/20";
const STATE_ERR =
  "border-danger/60 focus:border-danger focus:ring-danger/20";

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  {
    label,
    helpText,
    error,
    className = "",
    textareaClassName = "",
    id,
    rows = 3,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const describedById = helpText || error ? `${textareaId}-desc` : undefined;
  const stateClasses = error ? STATE_ERR : STATE_OK;

  return (
    <div className={`flex flex-col gap-1.5 text-sm ${className}`}>
      {label ? (
        <label
          htmlFor={textareaId}
          className="text-xs font-medium uppercase tracking-wide text-foreground-muted"
        >
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        className={`${BASE} ${stateClasses} ${textareaClassName}`.trim()}
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
