import { useMemo } from 'react';
import { PROCESSES } from '../data';
import { CERT_ICONS, CERT_COLORS } from '../certIcons';

export default function CertificationMatrix({ operators }) {
  const counts = useMemo(() => {
    const result = {};
    for (const p of PROCESSES) result[p] = { S1: 0, S2: 0, total: 0 };
    for (const op of operators) {
      if (!op.active) continue;
      for (const cert of op.certifications) {
        if (!result[cert]) continue;
        result[cert][op.shift] = (result[cert][op.shift] || 0) + 1;
        result[cert].total += 1;
      }
    }
    return result;
  }, [operators]);

  const sortedOps = useMemo(
    () => [...operators].sort((a, b) => {
      if (a.shift !== b.shift) return a.shift.localeCompare(b.shift);
      return a.name.localeCompare(b.name);
    }),
    [operators],
  );

  return (
    <div className="nk-cert-matrix" aria-label="Certifications matrix">
      <header className="nk-cm-header">
        <h2 className="nk-cm-title">Certifieringsmatris</h2>
        <p className="nk-cm-subtitle">
          Översikt över vilka operatörer som är certifierade för varje process.
        </p>
      </header>

      <div className="nk-cm-scroll">
        <table className="nk-cm-table">
          <thead>
            <tr>
              <th scope="col" className="nk-cm-name-col">Operatör</th>
              <th scope="col" className="nk-cm-shift-col">Skift</th>
              {PROCESSES.map(p => {
                const Icon = CERT_ICONS[p];
                return (
                  <th key={p} scope="col" className="nk-cm-proc-col" title={p}>
                    <span
                      className="nk-cm-proc-icon"
                      style={{ color: CERT_COLORS[p] }}
                      aria-hidden="true"
                    >
                      {Icon ? <Icon size={16} strokeWidth={2.25} /> : null}
                    </span>
                    <span className="nk-cm-proc-lbl">{p}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedOps.map(op => (
              <tr key={op.id} className={op.active ? '' : 'nk-cm-inactive'}>
                <th scope="row" className="nk-cm-name-cell">{op.name}</th>
                <td className="nk-cm-shift-cell">
                  <span className={`nk-op-avatar sm ${op.shift === 'S2' ? 's2' : ''}`}>
                    {op.shift}
                  </span>
                </td>
                {PROCESSES.map(p => {
                  const has = op.certifications.includes(p);
                  const Icon = CERT_ICONS[p];
                  return (
                    <td key={p} className="nk-cm-cell" aria-label={has ? `${op.name} has ${p}` : undefined}>
                      {has ? (
                        <span className="nk-cm-check" style={{ color: CERT_COLORS[p] }}>
                          {Icon ? <Icon size={16} strokeWidth={2.5} /> : '✓'}
                        </span>
                      ) : (
                        <span className="nk-cm-empty" aria-hidden="true">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="nk-cm-name-cell">Totalt</th>
              <td />
              {PROCESSES.map(p => (
                <td key={p} className="nk-cm-count">
                  <div className="nk-cm-count-total">{counts[p].total}</div>
                  <div className="nk-cm-count-split">
                    <span>S1: {counts[p].S1}</span>
                    <span>S2: {counts[p].S2}</span>
                  </div>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
