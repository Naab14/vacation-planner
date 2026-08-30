import { operatorIcon } from '../operatorIcon';

/** Small circular avatar showing an operator's initials over a stable colour. */
export default function OperatorAvatar({ operator, size = 26, title }) {
  const { initials, color } = operatorIcon(operator);
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold shrink-0 select-none"
      title={title ?? operator?.name}
      aria-hidden="true"
      style={{
        width: size, height: size, background: color, color: '#fff',
        fontSize: size * 0.4, lineHeight: 1, letterSpacing: '-0.02em',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }}>
      {initials}
    </span>
  );
}
