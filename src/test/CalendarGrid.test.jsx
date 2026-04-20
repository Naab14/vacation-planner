import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarGrid from '../components/calendar/CalendarGrid';
import { buildDefaultDemand, defaultSettings, PROCESSES } from '../data';

const makeOp = (id, shift = 'S1', active = true, certifications = PROCESSES) =>
  ({ id, name: `Op ${id}`, shift, active, certifications });

const makeBlock = (id, operatorId, startWeek, endWeek, status = 'draft') =>
  ({ id, operatorId, startWeek, endWeek, status });

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
  showDemand: false,
  onToggleDemand: vi.fn(),
  updateDemand: vi.fn(),
  zoom: 'week',
  onZoomChange: vi.fn(),
});

describe('CalendarGrid', () => {
  it('renders operator names as rows', () => {
    render(<CalendarGrid {...defaultProps()} />);
    expect(screen.getByText('Op 1')).toBeInTheDocument();
    expect(screen.getByText('Op 2')).toBeInTheDocument();
  });

  it('renders week headers', () => {
    render(<CalendarGrid {...defaultProps()} />);
    expect(screen.getByText('v.15')).toBeInTheDocument();
    expect(screen.getByText('v.26')).toBeInTheDocument();
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

  it('renders zoom buttons', () => {
    const props = defaultProps();
    render(<CalendarGrid {...props} />);
    const buttons = screen.getAllByRole('button');
    const minusBtn = buttons.find(b => b.textContent === '−');
    const plusBtn = buttons.find(b => b.textContent === '+');
    expect(minusBtn).toBeDefined();
    expect(plusBtn).toBeDefined();
  });

  it('calls onZoomChange when zoom buttons clicked', () => {
    const props = defaultProps();
    render(<CalendarGrid {...props} />);
    const buttons = screen.getAllByRole('button');
    const minusBtn = buttons.find(b => b.textContent === '−');
    fireEvent.click(minusBtn);
    expect(props.onZoomChange).toHaveBeenCalledWith('day');
  });

  it('shows week label in week zoom', () => {
    render(<CalendarGrid {...defaultProps()} />);
    expect(screen.getByText('v.15 — v.26')).toBeInTheDocument();
  });

  it('renders coverage rows with values', () => {
    render(<CalendarGrid {...defaultProps()} />);
    const coverageText = screen.getAllByText(/^\d+\/\d+$/);
    expect(coverageText.length).toBeGreaterThan(0);
  });

  it('renders data-week and data-op attributes on cells', () => {
    render(<CalendarGrid {...defaultProps()} />);
    const cells = document.querySelectorAll('[data-week][data-op]');
    expect(cells.length).toBeGreaterThan(0);
    expect(cells[0].dataset.week).toBeDefined();
    expect(cells[0].dataset.op).toBeDefined();
  });

  it('shows block label when vacation block exists', () => {
    const props = defaultProps();
    props.vacationBlocks = [makeBlock('b1', '1', 16, 18)];
    render(<CalendarGrid {...props} />);
    expect(screen.getByText('v.16-18')).toBeInTheDocument();
  });

  it('shows note indicator on blocks that have a note', () => {
    const props = defaultProps();
    props.vacationBlocks = [{ ...makeBlock('b1', '1', 16, 18), note: 'Parental leave' }];
    render(<CalendarGrid {...props} />);
    expect(screen.getByLabelText('Has note')).toBeInTheDocument();
  });

  it('does not show note indicator on blocks without a note', () => {
    const props = defaultProps();
    props.vacationBlocks = [makeBlock('b1', '1', 16, 18)];
    render(<CalendarGrid {...props} />);
    expect(screen.queryByLabelText('Has note')).not.toBeInTheDocument();
  });

  it('renders day zoom when zoom=day', () => {
    const props = defaultProps();
    props.zoom = 'day';
    render(<CalendarGrid {...props} />);
    expect(screen.getByText(/Mån/)).toBeInTheDocument();
    expect(screen.getByText(/Sön/)).toBeInTheDocument();
  });

  it('shows tools row when gear button clicked', () => {
    const props = defaultProps();
    render(<CalendarGrid {...props} />);
    const gearBtn = screen.getByText('⚙');
    fireEvent.click(gearBtn);
    expect(screen.getByText('Utkast')).toBeInTheDocument();
    expect(screen.getByText('Godkänd')).toBeInTheDocument();
  });

  it('shows demand toggle in tools row', () => {
    const props = defaultProps();
    render(<CalendarGrid {...props} />);
    fireEvent.click(screen.getByText('⚙'));
    const demandBtn = screen.getByText('Demand');
    fireEvent.click(demandBtn);
    expect(props.onToggleDemand).toHaveBeenCalled();
  });
});
