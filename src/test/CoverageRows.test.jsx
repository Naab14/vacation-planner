import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CoverageRows from '../components/calendar/CoverageRows';

const processes = [{ id: 'packning', name: 'Packning' }];
const operators = [
  { id: 'op1', name: 'Anna', shift: 'S1', active: true, certifications: ['packning'] },
];
const demand = { packning: { 10: 1 } };

function renderRows() {
  render(
    <CoverageRows
      operators={operators}
      vacationBlocks={[]}
      demand={demand}
      processes={processes}
      weeks={[10]}
      shiftMode="combined"
      holidayMap={{}}
      label="Coverage"
    />,
  );
}

describe('CoverageRows', () => {
  it('does not expose passive coverage cells as buttons', () => {
    renderRows();

    expect(screen.queryByRole('button', { name: /Packning v\.10/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Packning v.10: 1/1')).toBeInTheDocument();
  });

  it('clamps the tooltip when a focused cell is near the bottom of the viewport', () => {
    renderRows();
    const cell = screen.getByLabelText('Packning v.10: 1/1');
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 100 });
    cell.getBoundingClientRect = () => ({ top: 96, left: 20, right: 80, width: 60, height: 24, bottom: 120 });

    fireEvent.focus(cell);

    expect(screen.getByRole('tooltip').style.top).toBe('8px');
  });
});
