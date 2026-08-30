import OperatorPanel from '../components/OperatorPanel';

export default function Employees({
  operators,
  processes,
  onUpdateOperator,
  showMgmt,
  onToggleMgmt,
  onAddOperator,
  onRemoveOperator,
  onDownloadTemplate,
}) {
  return (
    <main className="flex-1 flex overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="px-4 py-3" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>Employees</h2>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Manage operators, shifts, active status, and certifications.</p>
        </div>
        <OperatorPanel
          operators={operators}
          processes={processes}
          onUpdateOperator={onUpdateOperator}
          showMgmt={showMgmt}
          onToggleMgmt={onToggleMgmt}
          onAddOperator={onAddOperator}
          onRemoveOperator={onRemoveOperator}
          onDownloadTemplate={onDownloadTemplate}
          collapsed={false}
          onToggleCollapse={() => {}}
        />
      </div>
    </main>
  );
}
