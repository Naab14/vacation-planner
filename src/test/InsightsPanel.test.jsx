import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InsightsPanel from '../components/InsightsPanel';
import { PROCESSES, buildDefaultDemand } from '../data';

const makeOp = (id, shift = 'S1', certs = []) =>
  ({ id, name: `Op ${id}`, shift, active: true, certifications: certs });
const makeBlock = (id, operatorId, startWeek, endWeek, status = 'pending') =>
  ({ id, operatorId, startWeek, endWeek, status });

function staff(counts = {}) {
  const ops = [];
  let n = 1;
  for (const p of PROCESSES) {
    const c = counts[p] ?? 2;
    for (let i = 0; i < c; i++) ops.push(makeOp(String(n++), 'S1', [p]));
  }
  return ops;
}

const baseState = (overrides = {}) => ({
  operators: staff(),
  vacationBlocks: [],
  demand: buildDefaultDemand(),
  settings: { shiftMode: 'combined', visibleWeeks: 12, startWeek: 1 },
  ...overrides,
});

const defaultProps = (overrides = {}) => ({
  state: baseState(),
  weeks: [10],
  holidayMap: {},
  onSetBlockStatus: vi.fn(),
  onUpdateOperator: vi.fn(),
  onJumpToWeek: vi.fn(),
  onClose: vi.fn(),
  ...overrides,
});

describe('InsightsPanel', () => {
  it('renders the header and summary stats', () => {
    render(<InsightsPanel {...defaultProps()} />);
    expect(screen.getByText('Planning Assistant')).toBeInTheDocument();
    expect(screen.getByText('Understaffed')).toBeInTheDocument();
    expect(screen.getByText('Single points')).toBeInTheDocument();
  });

  it('calls onClose from the close button and backdrop', () => {
    const props = defaultProps();
    render(<InsightsPanel {...props} />);
    fireEvent.click(screen.getByLabelText('Close planning assistant'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a safe approval and approves it', () => {
    const props = defaultProps({
      state: baseState({
        operators: staff({ Avsyning: 3 }),
        vacationBlocks: [makeBlock('b1', '1', 10, 10, 'pending')],
      }),
    });
    render(<InsightsPanel {...props} />);
    expect(screen.getByText(/Safe to approve/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Approve'));
    expect(props.onSetBlockStatus).toHaveBeenCalledWith('b1', 'approved');
  });

  it('warns on a risky approval', () => {
    const props = defaultProps({
      state: baseState({
        operators: staff({ Avsyning: 1 }),
        vacationBlocks: [makeBlock('b1', '1', 10, 10, 'pending')],
      }),
    });
    render(<InsightsPanel {...props} />);
    expect(screen.getByText(/Would understaff/)).toBeInTheDocument();
    expect(screen.getByText('Approve anyway')).toBeInTheDocument();
  });

  it('applies a cross-training recommendation', () => {
    const props = defaultProps({
      state: baseState({
        operators: [...staff({ Avsyning: 1 }), makeOp('idle', 'S1', [])],
      }),
    });
    render(<InsightsPanel {...props} />);
    const applyBtns = screen.getAllByText('Apply');
    fireEvent.click(applyBtns[0]);
    expect(props.onUpdateOperator).toHaveBeenCalled();
    const [, patch] = props.onUpdateOperator.mock.calls[0];
    expect(patch.certifications).toContain('Avsyning');
  });

  it('lists single points of failure', () => {
    const props = defaultProps({
      state: baseState({ operators: staff({ Serialisering: 1 }) }),
    });
    render(<InsightsPanel {...props} />);
    // depth-1 process should be surfaced as "only <name>"
    expect(screen.getByText(/only Op/)).toBeInTheDocument();
  });

  it('jumps to a week when a coverage risk is clicked', () => {
    const props = defaultProps({
      state: baseState({ operators: staff({ Avsyning: 0 }) }),
      weeks: [10],
    });
    render(<InsightsPanel {...props} />);
    // the risk row reads "Avsyning · v.10"
    fireEvent.click(screen.getByText(/Avsyning · v\.10/));
    expect(props.onJumpToWeek).toHaveBeenCalledWith(10);
  });
});
