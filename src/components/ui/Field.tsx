interface FieldBaseProps {
  label: string;
  /** Texto de ayuda opcional bajo el campo. */
  hint?: string;
  className?: string;
}

interface TextFieldProps extends FieldBaseProps {
  type: 'text';
  value: string;
  onChange: (v: string) => void;
}

interface NumberFieldProps extends FieldBaseProps {
  type: 'number';
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Adorno a la derecha del input, p.ej. "$" o "%". */
  suffix?: string;
  prefix?: string;
}

type FieldProps = TextFieldProps | NumberFieldProps;

const inputBase =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 ' +
  'transition-all focus:border-brand-secondary focus:bg-white focus:outline-none ' +
  'focus:ring-2 focus:ring-brand-secondary/40';

export function Field(props: FieldProps) {
  const { label, hint, className } = props;

  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      {props.type === 'text' ? (
        <input
          type="text"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className={inputBase}
        />
      ) : (
        <div className="relative">
          {props.prefix && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
              {props.prefix}
            </span>
          )}
          <input
            type="number"
            value={Number.isFinite(props.value) ? props.value : ''}
            step={props.step}
            min={props.min}
            max={props.max}
            onChange={(e) => props.onChange(e.target.valueAsNumber)}
            className={`${inputBase} ${props.prefix ? 'pl-7' : ''} ${
              props.suffix ? 'pr-9' : ''
            }`}
          />
          {props.suffix && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
              {props.suffix}
            </span>
          )}
        </div>
      )}

      {hint && <p className="mt-1 text-[11px] leading-tight text-slate-400">{hint}</p>}
    </div>
  );
}
