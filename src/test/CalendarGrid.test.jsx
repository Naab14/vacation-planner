import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarGrid from '../components/calendar/CalendarGrid';
import { buildDefaultDemand, defaultSettings, PROCESSES } from '../data';
import { getISOWeekMonday, getISOWeekFriday } from '../dateUtils';

const YEAR = new Date().getFullYear();

const makeOp = (id, shift = 'S1', active = true, certifications = PROCESSES) =>
  ({ id, name: `Op ${id}`, shift, active, certifications });

const makeBlock = (id, operatorId, startWeek, endWeek, status = 'draft') =>
  ({
    id, operatorId,
    startDate: getISOWeekMonday(YEAR, startWeek),
    endDate: getISOWeekFriday(YEAR, endWeek),
    status,
  });

const defaultProps = () => ({
  operators: [makeOp('1'), makeOp('2', 'S2')],
  vacationBlocks: [],
  demand: buildDefaultDemand(),
  settings: defaultSettings,
  weeks: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
  holidayMap: {},
  onAddBlock: vi.fn(),
  onUpdateBlock: vi.fn(),
  onDeleteBlock: vi.fn(),
  onSetBlockStatus: vi.fn(),
  setStartWeek: vi.fn(),
  setVisibleWeeks: vi.fn(),
  showDemand: false,
  onToggleDemand: vi.fn(),
  selectedOperatorId: null,
  onSelectOperator: vi.fn(),
});

describe('CalendarGrid', () => {
  it('renders operator names as rows', () => {
    render(<CalendarGrid {...defaultProps()} />);
    expect(screen.getByText('Op 1')).toBeInTheDocument();
    expect(screen.getByText('Op 2')).toBeInTheDocument();
  });

  it('renders week headers in day view', () => {
    render(<CalendarGrid {...defaultProps()} />);
    // v.15 appears in both toolbar label and week-header strip
    expect(screen.getAllByText('v.15').length).toBeGreaterThan(0);
    expect(screen.getAllByText('v.26').length).toBeGreaterThan(0);
  });

  it('renders the time slider', () => {
    render(<CalendarGrid {...defaultProps()} />);
    const slider = document.querySelector('.time-slider');
    expect(slider).toBeInTheDocument();
    expect(slider.type).toBe('range');
  });

  it('calls setStartWeek when slider changes', () => {
    const props = defaultProps();
    render(<CalendarGrid {...props} />);
    const slider = document.querySelector('.time-slider');
    fireEvent.change(slider, { target: { value: '20' } });
    expect(props.setStartWeek).toHaveBeenCalledWith(20);
  });

  it('renders zoom buttons with aria-labels', () => {
    render(<CalendarGrid {...defaultProps()} />);
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
  });

  it('+ button calls setVisibleWeeks with fewer weeks', () => {
    const props = defaultProps();
    render(<CalendarGrid {...props} />);
    fireEvent.click(screen.getByLabelText('Zoom in'));
    expect(props.setVisibleWeeks).toHaveBeenCalledWith(8); // 12 - 4
  });

  it('- button calls setVisibleWeeks with more weeks', () => {
    const props = defaultProps();
    render(<CalendarGrid {...props} />);
    fireEvent.click(screen.getByLabelText('Zoom out'));
    expect(props.setVisibleWeeks).toHaveBeenCalledWith(16); // 12 + 4
  });

  it('zoom in disabled when visibleWeeks is at minimum (4)', () => {
    const props = { ...defaultProps(), settings: { ...defaultSettings, visibleWeeks: 4 } };
    render(<CalendarGrid {...props} />);
    expect(screen.getByLabelText('Zoom in')).toBeDisabled();
  });

  it('zoom out disabled when visibleWeeks is at maximum (26)', () => {
    const props = { ...defaultProps(), settings: { ...defaultSettings, visibleWeeks: 26 } };
    render(<CalendarGrid {...props} />);
    expect(screen.getByLabelText('Zoom out')).toBeDisabled();
  });

  it('renders day view always (shows Swedish day headers)', () => {
    render(<CalendarGrid {...defaultProps()} />);
    expect(screen.getAllByText(/Mån/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Sön/).length).toBeGreaterThan(0);
  });

  it('day view spans all visible weeks (12 × 7 = 84 day columns)', () => {
    render(<CalendarGrid {...defaultProps()} />);
    expect(screen.getAllByText(/Mån/).length).toBe(12);
  });

  it('shows coverage toggle button', () => {
    render(<CalendarGrid {...defaultProps()} />);
    expect(screen.getByText('Show Coverage')).toBeInTheDocument();
  });

  it('renders data-week and data-op attributes on day cells', () => {
    render(<CalendarGrid {...defaultProps()} />);
    const cells = document.querySelectorAll('[data-week][data-op]');
    expect(cells.length).toBeGreaterThan(0);
    expect(cells[0].dataset.week).toBeDefined();
    expect(cells[0].dataset.op).toBeDefined();
  });

  it('shows status chip when vacation block exists', () => {
    const props = defaultProps();
    props.vacationBlocks = [makeBlock('b1', '1', 16, 18)];
    render(<CalendarGrid {...props} />);
    // draft block shows 'Utk' chip at block start
    expect(screen.getByText('Utk')).toBeInTheDocument();
  });

  it('shows comment indicator on blocks that have a comment', () => {
    const props = defaultProps();
    props.vacationBlocks = [{ ...makeBlock('b1', '1', 16, 18), comment: 'Parental leave' }];
    render(<CalendarGrid {...props} />);
    expect(screen.getByLabelText('Has comment')).toBeInTheDocument();
  });

  it('does not show comment indicator on blocks without a comment', () => {
    const props = defaultProps();
    props.vacationBlocks = [makeBlock('b1', '1', 16, 18)];
    render(<CalendarGrid {...props} />);
    expect(screen.queryByLabelText('Has comment')).not.toBeInTheDocument();
  });

  it('shows tools row when gear button clicked', () => {
    const props = defaultProps();
    render(<CalendarGrid {...props} />);
    fireEvent.click(screen.getByText('⚙'));
    expect(screen.getByText('Utkast')).toBeInTheDocument();
    expect(screen.getByText('Beviljad')).toBeInTheDocument();
  });

  it('shows demand toggle in tools row', () => {
    const props = defaultProps();
    render(<CalendarGrid {...props} />);
    fireEvent.click(screen.getByText('⚙'));
    fireEvent.click(screen.getByText('Demand'));
    expect(props.onToggleDemand).toHaveBeenCalled();
  });

  it('shows holiday tooltip with name and date on week header', () => {
    const props = defaultProps();
    // Week 17 spans April 20-26 in 2026; use Monday April 20
    props.holidayMap = { 17: { holidays: [{ name: 'Testhelg', dateStr: '2026-04-20', year: 2026 }] } };
    render(<CalendarGrid {...props} />);
    const header = document.querySelector('[title*="Testhelg"]');
    expect(header).toBeInTheDocument();
    expect(header.getAttribute('title')).toContain('2026-04-20');
  });

  it('applies holiday stripe pattern to holiday day cells', () => {
    const props = defaultProps();
    props.holidayMap = { 17: { holidays: [{ name: 'Testhelg', dateStr: '2026-04-20', year: 2026 }] } };
    render(<CalendarGrid {...props} />);
    const cell = document.querySelector('[data-week="17"][data-op="1"]');
    expect(cell).toBeInTheDocument();
    expect(cell.style.background).toContain('holiday-pattern');
  });

  it('holiday cell title includes name + date', () => {
    const props = defaultProps();
    props.holidayMap = { 17: { holidays: [{ name: 'Testhelg', dateStr: '2026-04-20', year: 2026 }] } };
    render(<CalendarGrid {...props} />);
    const cell = document.querySelector('[data-week="17"][data-op="1"]');
    expect(cell.getAttribute('title')).toContain('Testhelg');
    expect(cell.getAttribute('title')).toContain('2026-04-20');
  });

  it('vacation block overrides holiday stripe (block styling wins)', () => {
    const props = defaultProps();
    props.holidayMap = { 17: { holidays: [{ name: 'Testhelg', dateStr: '2026-04-20', year: 2026 }] } };
    props.vacationBlocks = [makeBlock('b1', '1', 17, 17, 'beviljad')];
    render(<CalendarGrid {...props} />);
    const cell = document.querySelector('[data-week="17"][data-op="1"]');
    expect(cell.style.background).not.toContain('holiday-pattern');
    expect(cell.getAttribute('title')).toBeNull();
  });
});
