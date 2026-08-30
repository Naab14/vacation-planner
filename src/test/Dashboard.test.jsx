import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../modules/Dashboard';
import { buildDefaultDemand } from '../schema';

const processes = [{ id: 'avsyning', name: 'Avsyning' }];
const operators = [
  { id: 'op1', name: 'Anna', shift: 'S1', active: true, certifications: ['avsyning'], icon: { initials: 'AN', color: '#4f46e5' } },
];

function statValue(label) {
  const statLabel = screen.getAllByText(label).find(element => element.className.includes('uppercase'));
  return statLabel.parentElement.querySelector('.text-2xl').textContent;
}

describe('Dashboard', () => {
  it('renders exact health summary KPI values', () => {
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
    expect(statValue('Red weeks')).toBe('1');
    expect(statValue('Pending requests')).toBe('1');
    expect(statValue('Off this week')).toBe('1');
    expect(statValue('Capacity gaps')).toBe('2');
    expect(screen.getByText('Anna')).toBeInTheDocument();
  });
});
