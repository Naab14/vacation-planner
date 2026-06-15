import { getAllCoverageForWeek } from '../coverage';

const colorMap = {
  green: 'var(--coverage-green)',
  yellow: 'var(--coverage-yellow)',
  red: 'var(--coverage-red)',
};

export default function ExportPrint({
  operators = [],
  vacationBlocks = [],
  demand = {},
  processes = [],
  weeks = [],
  settings = {},
  holidayMap = {},
}) {
  const operatorById = new Map(operators.map(op => [op.id, op]));
  const blocksByOperator = new Map();
  vacationBlocks.forEach(block => {
    const list = blocksByOperator.get(block.operatorId) || [];
    list.push(block);
    blocksByOperator.set(block.operatorId, list);
  });

  const coverageByWeek = {};
  weeks.forEach(week => {
    coverageByWeek[week] = getAllCoverageForWeek(
      operators,
      vacationBlocks,
      demand,
      week,
      settings.shiftMode,
      null,
      holidayMap,
      processes,
      'projected',
    );
  });

  return (
    <main className="flex-1 overflow-auto print:bg-white" style={{ background: 'var(--bg-primary)' }}>
      <div className="no-print flex items-center gap-3 px-5 py-4" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Export / Print</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Printable vacation plan and projected coverage.</p>
        </div>
        <button onClick={() => window.print()} className="ml-auto px-3 py-1.5 text-sm font-semibold"
          style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--border-radius)' }}>
          Print
        </button>
      </div>

      <section className="p-5">
        <h3 className="text-lg font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>Printable plan</h3>
        <div className="overflow-auto" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm border-collapse">
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                <th className="text-left px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>Operator</th>
                <th className="text-left px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>Shift</th>
                <th className="text-left px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>Vacation</th>
              </tr>
            </thead>
            <tbody>
              {operators.map(op => {
                const ranges = (blocksByOperator.get(op.id) || [])
                  .map(block => `v.${block.startWeek}-${block.endWeek} (${block.status})`)
                  .join(', ');
                return (
                  <tr key={op.id}>
                    <td className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>{op.name}</td>
                    <td className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>{op.shift}</td>
                    <td className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>{ranges || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="p-5">
        <h3 className="text-lg font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>Coverage heatmap</h3>
        <div className="overflow-auto" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-xs border-collapse">
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                <th className="text-left px-2 py-2" style={{ borderBottom: '1px solid var(--border)' }}>Process</th>
                {weeks.map(week => <th key={week} className="px-2 py-2" style={{ borderBottom: '1px solid var(--border)' }}>v.{week}</th>)}
              </tr>
            </thead>
            <tbody>
              {processes.map(process => (
                <tr key={process.id}>
                  <td className="px-2 py-2 font-semibold" style={{ borderBottom: '1px solid var(--border)' }}>{process.name}</td>
                  {weeks.map(week => {
                    const cov = coverageByWeek[week]?.[process.id];
                    return (
                      <td key={week} className="px-2 py-2 text-center font-semibold"
                        style={{ color: cov ? colorMap[cov.level] : 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        {cov ? `${cov.covered}/${cov.required}` : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="p-5 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {vacationBlocks.map(block => {
          const op = operatorById.get(block.operatorId);
          return <div key={block.id}>{op?.name || block.operatorId}: v.{block.startWeek}-{block.endWeek} {block.status}</div>;
        })}
      </section>
    </main>
  );
}
