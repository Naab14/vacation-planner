import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CertificationMatrix from '../modules/CertificationMatrix';

const props = (over = {}) => ({
  operators: [
    { id: 'op1', name: 'Anna Lindgren', shift: 'S1', active: true, certifications: ['Avsyning'] },
    { id: 'op2', name: 'Erik Holm', shift: 'S2', active: true, certifications: [] },
  ],
  processes: ['Avsyning', 'Serialisering'],
  onToggleCert: vi.fn(),
  onAddProcess: vi.fn(),
  onRenameProcess: vi.fn(),
  onRemoveProcess: vi.fn(),
  ...over,
});

describe('CertificationMatrix', () => {
  it('renders operators and processes', () => {
    render(<CertificationMatrix {...props()} />);
    expect(screen.getByText('Anna Lindgren')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Avsyning' })).toBeInTheDocument();
  });

  it('toggles a certification cell', () => {
    const p = props();
    render(<CertificationMatrix {...p} />);
    fireEvent.click(screen.getByLabelText('Erik Holm — Avsyning: not certified'));
    expect(p.onToggleCert).toHaveBeenCalledWith('op2', 'Avsyning');
  });

  it('adds a new process', () => {
    const p = props();
    render(<CertificationMatrix {...p} />);
    fireEvent.change(screen.getByLabelText('New process name'), { target: { value: 'Etikettering' } });
    fireEvent.click(screen.getByText('+ Add'));
    expect(p.onAddProcess).toHaveBeenCalledWith('Etikettering');
  });

  it('filters rows by certification', () => {
    render(<CertificationMatrix {...props()} />);
    fireEvent.change(screen.getByLabelText('Search matrix'), { target: { value: 'avsyning' } });
    expect(screen.getByText('Anna Lindgren')).toBeInTheDocument();
    expect(screen.queryByText('Erik Holm')).not.toBeInTheDocument();
  });
});
