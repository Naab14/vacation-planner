import { type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const base =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ' +
  'transition-[box-shadow,transform,background-color] duration-(--motion-base) ease-(--ease-spring) ' +
  'hover:[transform:var(--lift-hover)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: '[background:var(--gradient-hero)] text-ink-inverse hover:shadow-glow-accent',
  secondary: 'border border-line-strong bg-raised text-ink hover:shadow-glow-accent',
  danger: 'bg-alert text-ink-inverse hover:shadow-glow-risk',
  ghost: 'text-ink-muted hover:bg-raised hover:text-ink',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
