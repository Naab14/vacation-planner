import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BlockPopover from '../components/calendar/BlockPopover';

const makeBlock = (overrides = {}) => ({
  id: 'b1',
  operatorId: 'op1',
  startDate: '2026-05-11',
  endDate: '2026-05-29',
  status: 'draft',
  ...overrides,
});

const defaultProps = (overrides = {}) => ({
  x: 100, y: 100,
  block: makeBlock(),
  dateStr: null,
  onSetStatus: vi.fn(),
  onDelete: vi.fn(),
  onSetDayStatus: vi.fn(),
  onClearDayStatus: vi.fn(),
  onSetComment: vi.fn(),
  onClose: vi.fn(),
  ...overrides,
});

describe('BlockPopover — comment', () => {
  it('renders a comment textarea when onSetComment is provided', () => {
    render(<BlockPopover {...defaultProps()} />);
    expect(screen.getByLabelText('Block comment')).toBeInTheDocument();
  });

  it('does not render the textarea when onSetComment is absent', () => {
    render(<BlockPopover {...defaultProps({ onSetComment: undefined })} />);
    expect(screen.queryByLabelText('Block comment')).not.toBeInTheDocument();
  });

  it('shows the existing block comment as initial textarea value', () => {
    const block = makeBlock({ comment: 'Back-up: Erik' });
    render(<BlockPopover {...defaultProps({ block })} />);
    expect(screen.getByLabelText('Block comment')).toHaveValue('Back-up: Erik');
  });

  it('commits the comment on blur', () => {
    const props = defaultProps();
    render(<BlockPopover {...props} />);
    const ta = screen.getByLabelText('Block comment');
    fireEvent.change(ta, { target: { value: 'Parental leave' } });
    fireEvent.blur(ta);
    expect(props.onSetComment).toHaveBeenCalledWith('b1', 'Parental leave');
  });

  it('does not call onSetComment on blur when value is unchanged', () => {
    const block = makeBlock({ comment: 'same' });
    const props = defaultProps({ block });
    render(<BlockPopover {...props} />);
    fireEvent.blur(screen.getByLabelText('Block comment'));
    expect(props.onSetComment).not.toHaveBeenCalled();
  });

  it('commits and closes on Ctrl+Enter', () => {
    const props = defaultProps();
    render(<BlockPopover {...props} />);
    const ta = screen.getByLabelText('Block comment');
    fireEvent.change(ta, { target: { value: 'Ship it' } });
    fireEvent.keyDown(ta, { key: 'Enter', ctrlKey: true });
    expect(props.onSetComment).toHaveBeenCalledWith('b1', 'Ship it');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('still renders status buttons and delete when comment is shown', () => {
    render(<BlockPopover {...defaultProps()} />);
    expect(screen.getByText('Utkast')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});
