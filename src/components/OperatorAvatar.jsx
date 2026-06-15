import { buildOperatorIcon } from '../schema';

export default function OperatorAvatar({ operator, size = 24 }) {
  const icon = operator.icon || buildOperatorIcon(operator.name);
  return (
    <span
      aria-label={`${operator.name} icon`}
      className="operator-avatar inline-flex items-center justify-center shrink-0 font-bold"
      style={{
        width: size,
        height: size,
        borderRadius: '999px',
        background: icon.color,
        color: '#fff',
        fontSize: Math.max(10, Math.round(size * 0.42)),
        boxShadow: '0 2px 8px rgba(15,23,42,0.16)',
      }}
    >
      {icon.initials}
    </span>
  );
}
