import type { HTMLAttributes } from 'react';

export function Panel({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border-2 border-line-strong bg-panel p-6 shadow-panel ${className}`}
      {...props}
    />
  );
}
