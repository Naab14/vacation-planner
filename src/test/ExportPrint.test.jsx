import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExportPrint from '../modules/ExportPrint';
import { buildDefaultDemand } from '../schema';

const processes = [{ id: 'avsyning', name: 'Avsyning' }];
const operators = [{ id: 'op1', name: 'Anna', shift: 'S1', active: true, certifications: ['avsyning'] }];

describe('ExportPrint', () => {
  it('renders printable plan and coverage heatmap', () => {
    render(
      <ExportPrint
        operators={operators}
        vacationBlocks={[{ id: 'a', operatorId: 'op1', startWeek: 20, endWeek: 21, status: 'approved' }]}
        demand={buildDefaultDemand(processes)}
        processes={processes}
        weeks={[20, 21]}
        settings={{ shiftMode: 'combined' }}
        holidayMap={{}}
      />,
    );
    expect(screen.getByText('Printable plan')).toBeInTheDocument();
    expect(screen.getByText('Coverage heatmap')).toBeInTheDocument();
    expect(screen.getByText('Anna')).toBeInTheDocument();
    expect(screen.getAllByText('0/2').length).toBeGreaterThan(0);
  });
});
