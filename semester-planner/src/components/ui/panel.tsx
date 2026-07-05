import type { HTMLAttributes } from 'react';

export function Panel({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-line bg-panel p-6 shadow-panel ${className}`}
      {...props}
    />
  );
}
