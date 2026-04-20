import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TopBar from '../components/TopBar';

const defaultProps = () => ({
  shiftMode: 'separate',
  onShiftModeChange: vi.fn(),
  theme: 'neo-kinetic',
  onThemeChange: vi.fn(),
  mode: 'light',
  onToggleMode: vi.fn(),
  onImportCSV: vi.fn(),
  onExportCSV: vi.fn(),
  onSave: vi.fn(),
  onExportJSON: vi.fn(),
  onImportJSON: vi.fn(),
  onReset: vi.fn(),
  onShare: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  canUndo: true,
  canRedo: true,
});

describe('TopBar', () => {
  it('renders the brand wordmark', () => {
    render(<TopBar {...defaultProps()} />);
    expect(screen.getByText('Uppsala · Works Planning')).toBeInTheDocument();
    // Wordmark is split across spans; match by container text content
    const wordmark = document.querySelector('.nk-brand-wordmark');
    expect(wordmark).not.toBeNull();
    expect(wordmark.textContent).toContain('Semester');
    expect(wordmark.textContent).toContain('Planner');
  });

  it('renders shift mode buttons', () => {
    render(<TopBar {...defaultProps()} />);
    expect(screen.getByText('Separate')).toBeInTheDocument();
    expect(screen.getByText('Combined')).toBeInTheDocument();
    expect(screen.getByText('Summer')).toBeInTheDocument();
  });

  it('calls onShiftModeChange when clicking a mode button', () => {
    const props = defaultProps();
    render(<TopBar {...props} />);
    fireEvent.click(screen.getByText('Combined'));
    expect(props.onShiftModeChange).toHaveBeenCalledWith('combined');
  });

  it('calls onShiftModeChange with summer', () => {
    const props = defaultProps();
    render(<TopBar {...props} />);
    fireEvent.click(screen.getByText('Summer'));
    expect(props.onShiftModeChange).toHaveBeenCalledWith('summer');
  });

  it('renders the theme select with correct value', () => {
    render(<TopBar {...defaultProps()} />);
    const select = screen.getByDisplayValue('Neo-Kinetic');
    expect(select).toBeInTheDocument();
  });

  it('calls onThemeChange when changing theme', () => {
    const props = defaultProps();
    render(<TopBar {...props} />);
    const select = screen.getByDisplayValue('Neo-Kinetic');
    fireEvent.change(select, { target: { value: 'harbor' } });
    expect(props.onThemeChange).toHaveBeenCalledWith('harbor');
  });

  it('renders the Share button', () => {
    render(<TopBar {...defaultProps()} />);
    expect(screen.getByText('Share link')).toBeInTheDocument();
  });

  it('calls onShare when Share clicked', () => {
    const props = defaultProps();
    render(<TopBar {...props} />);
    fireEvent.click(screen.getByText('Share link'));
    expect(props.onShare).toHaveBeenCalled();
  });

  it('renders the mode toggle', () => {
    render(<TopBar {...defaultProps()} />);
    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
  });

  it('calls onToggleMode when mode toggle clicked', () => {
    const props = defaultProps();
    render(<TopBar {...props} />);
    fireEvent.click(screen.getByLabelText('Switch to dark mode'));
    expect(props.onToggleMode).toHaveBeenCalled();
  });

  it('opens overflow menu and shows actions', () => {
    render(<TopBar {...defaultProps()} />);
    fireEvent.click(screen.getByText('⋮'));
    expect(screen.getByText('Import CSV')).toBeInTheDocument();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Export JSON')).toBeInTheDocument();
    expect(screen.getByText('Import JSON')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('calls onSave from overflow menu', () => {
    const props = defaultProps();
    render(<TopBar {...props} />);
    fireEvent.click(screen.getByText('⋮'));
    fireEvent.click(screen.getByText('Save'));
    expect(props.onSave).toHaveBeenCalled();
  });

  it('calls onExportJSON from overflow menu', () => {
    const props = defaultProps();
    render(<TopBar {...props} />);
    fireEvent.click(screen.getByText('⋮'));
    fireEvent.click(screen.getByText('Export JSON'));
    expect(props.onExportJSON).toHaveBeenCalled();
  });

  it('calls onImportCSV from overflow menu', () => {
    const props = defaultProps();
    render(<TopBar {...props} />);
    fireEvent.click(screen.getByText('⋮'));
    fireEvent.click(screen.getByText('Import CSV'));
    expect(props.onImportCSV).toHaveBeenCalled();
  });

  it('calls onReset from overflow menu', () => {
    const props = defaultProps();
    render(<TopBar {...props} />);
    fireEvent.click(screen.getByText('⋮'));
    fireEvent.click(screen.getByText('Reset'));
    expect(props.onReset).toHaveBeenCalled();
  });

  it('closes overflow menu on Escape', () => {
    render(<TopBar {...defaultProps()} />);
    fireEvent.click(screen.getByText('⋮'));
    expect(screen.getByText('Save')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('renders Undo and Redo buttons', () => {
    render(<TopBar {...defaultProps()} />);
    expect(screen.getByLabelText('Undo')).toBeInTheDocument();
    expect(screen.getByLabelText('Redo')).toBeInTheDocument();
  });

  it('disables Undo/Redo buttons when canUndo/canRedo are false', () => {
    render(<TopBar {...defaultProps()} canUndo={false} canRedo={false} />);
    expect(screen.getByLabelText('Undo')).toBeDisabled();
    expect(screen.getByLabelText('Redo')).toBeDisabled();
  });

  it('calls onUndo and onRedo when respective buttons clicked', () => {
    const props = defaultProps();
    render(<TopBar {...props} />);
    fireEvent.click(screen.getByLabelText('Undo'));
    expect(props.onUndo).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('Redo'));
    expect(props.onRedo).toHaveBeenCalled();
  });
});
