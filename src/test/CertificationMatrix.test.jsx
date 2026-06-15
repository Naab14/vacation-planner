import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CertificationMatrix from '../modules/CertificationMatrix';

const processes = [
  { id: 'avsyning', name: 'Avsyning' },
  { id: 'serialisering', name: 'Serialisering' },
];

const operators = [
  { id: 'op1', name: 'Anna Lindgren', shift: 'S1', active: true, certifications: ['avsyning'], icon: { initials: 'AL', color: '#4f46e5' } },
  { id: 'op2', name: 'Erik Holm', shift: 'S2', active: true, certifications: [], icon: { initials: 'EH', color: '#0284c7' } },
];

describe('CertificationMatrix', () => {
  it('renders operators as rows and processes as columns', () => {
    render(<CertificationMatrix operators={operators} processes={processes} />);
    expect(screen.getByText('Anna Lindgren')).toBeInTheDocument();
    expect(screen.getByText('Erik Holm')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Avsyning')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Serialisering')).toBeInTheDocument();
  });

  it('toggles a certification cell', () => {
    const onToggleCertification = vi.fn();
    render(<CertificationMatrix operators={operators} processes={processes} onToggleCertification={onToggleCertification} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Erik Holm Avsyning' }));
    expect(onToggleCertification).toHaveBeenCalledWith('op2', 'avsyning');
  });

  it('adds a process from the inline form', () => {
    const onAddProcess = vi.fn();
    render(<CertificationMatrix operators={operators} processes={processes} onAddProcess={onAddProcess} />);
    fireEvent.change(screen.getByPlaceholderText('New process'), { target: { value: 'Packning' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add process' }));
    expect(onAddProcess).toHaveBeenCalledWith('Packning');
  });
});
