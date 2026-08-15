import { type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const base =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ' +
  'transition-[box-shadow,transform,background-color] duration-(--motion-fast) ease-(--ease-spring) ' +
  'hover:[transform:var(--lift-hover)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'border-2 border-line-strong bg-accent text-ink-inverse [box-shadow:4px_4px_0_0_var(--brand-yellow)] hover:[box-shadow:5px_5px_0_0_var(--brand-yellow)]',
  secondary: 'border-2 border-line-strong bg-panel text-ink shadow-panel hover:shadow-pop',
  danger: 'border-2 border-line-strong bg-alert text-ink-inverse shadow-panel hover:shadow-pop',
  ghost: 'text-ink-muted hover:bg-raised hover:text-ink',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
