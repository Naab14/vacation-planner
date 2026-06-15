import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../modules/Dashboard';
import { buildDefaultDemand } from '../schema';

const processes = [{ id: 'avsyning', name: 'Avsyning' }];
const operators = [
  { id: 'op1', name: 'Anna', shift: 'S1', active: true, certifications: ['avsyning'], icon: { initials: 'AN', color: '#4f46e5' } },
];

describe('Dashboard', () => {
  it('renders health summary cards', () => {
    render(
      <Dashboard
        operators={operators}
        vacationBlocks={[{ id: 'a', operatorId: 'op1', startWeek: 20, endWeek: 20, status: 'pending' }]}
        demand={buildDefaultDemand(processes)}
        processes={processes}
        weeks={[20, 21]}
        settings={{ shiftMode: 'combined' }}
        holidayMap={{}}
        onOpenPlanning={() => {}}
      />,
    );
    expect(screen.getByText('Plan health')).toBeInTheDocument();
    expect(screen.getByText('Pending requests')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getByText('Anna')).toBeInTheDocument();
  });
});
