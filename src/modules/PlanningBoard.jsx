import OperatorPanel from '../components/OperatorPanel';
import CalendarGrid from '../components/calendar/CalendarGrid';

export default function PlanningBoard({
  operators,
  vacationBlocks,
  demand,
  settings,
  processes,
  weeks,
  holidayMap,
  onUpdateOperator,
  showOperatorMgmt,
  onToggleOperatorMgmt,
  onAddOperator,
  onRemoveOperator,
  onDownloadTemplate,
  sidebarCollapsed,
  onToggleSidebar,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onSetBlockStatus,
  onSetBlockDayStatus,
  onClearBlockDayStatus,
  onSetBlockNote,
  setStartWeek,
  showDemand,
  onToggleDemand,
  updateDemand,
  zoom,
  onZoomChange,
}) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <OperatorPanel
        operators={operators}
        processes={processes}
        onUpdateOperator={onUpdateOperator}
        showMgmt={showOperatorMgmt}
        onToggleMgmt={onToggleOperatorMgmt}
        onAddOperator={onAddOperator}
        onRemoveOperator={onRemoveOperator}
        onDownloadTemplate={onDownloadTemplate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={onToggleSidebar}
      />

      <CalendarGrid
        operators={operators}
        vacationBlocks={vacationBlocks}
        demand={demand}
        settings={settings}
        processes={processes}
        weeks={weeks}
        holidayMap={holidayMap}
        onAddBlock={onAddBlock}
        onUpdateBlock={onUpdateBlock}
        onDeleteBlock={onDeleteBlock}
        onSetBlockStatus={onSetBlockStatus}
        onSetBlockDayStatus={onSetBlockDayStatus}
        onClearBlockDayStatus={onClearBlockDayStatus}
        onSetBlockNote={onSetBlockNote}
        setStartWeek={setStartWeek}
        showDemand={showDemand}
        onToggleDemand={onToggleDemand}
        updateDemand={updateDemand}
        zoom={zoom}
        onZoomChange={onZoomChange}
      />
    </div>
  );
}
