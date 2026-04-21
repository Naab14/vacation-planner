import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsPanel from '../components/SettingsPanel';

const defaultProps = () => ({
  shiftMode: 'separate',
  onShiftModeChange: vi.fn(),
  theme: 'neo-kinetic',
  onThemeChange: vi.fn(),
  mode: 'light',
  onToggleMode: vi.fn(),
  visibleWeeks: 12,
  onVisibleWeeksChange: vi.fn(),
  density: 'normal',
  onDensityChange: vi.fn(),
  grain: 0.45,
  onGrainChange: vi.fn(),
  asym: true,
  onAsymChange: vi.fn(),
  collapsed: false,
  onToggleCollapse: vi.fn(),
});

describe('SettingsPanel', () => {
  it('renders the panel header when expanded', () => {
    render(<SettingsPanel {...defaultProps()} />);
    expect(screen.getByText('Inställningar')).toBeInTheDocument();
  });

  it('shows a collapse button when expanded', () => {
    render(<SettingsPanel {...defaultProps()} />);
    expect(screen.getByLabelText('Collapse settings')).toBeInTheDocument();
  });

  it('calls onToggleCollapse when collapse button clicked', () => {
    const props = defaultProps();
    render(<SettingsPanel {...props} />);
    fireEvent.click(screen.getByLabelText('Collapse settings'));
    expect(props.onToggleCollapse).toHaveBeenCalled();
  });

  it('shows expand button when collapsed', () => {
    render(<SettingsPanel {...defaultProps()} collapsed={true} />);
    expect(screen.getByLabelText('Expand settings')).toBeInTheDocument();
  });

  it('hides body controls when collapsed', () => {
    render(<SettingsPanel {...defaultProps()} collapsed={true} />);
    expect(screen.queryByText('Inställningar')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Shift mode')).not.toBeInTheDocument();
  });

  it('renders shift mode buttons', () => {
    render(<SettingsPanel {...defaultProps()} />);
    expect(screen.getByText('Separate')).toBeInTheDocument();
    expect(screen.getByText('Combined')).toBeInTheDocument();
    expect(screen.getByText('Summer')).toBeInTheDocument();
  });

  it('calls onShiftModeChange with combined value', () => {
    const props = defaultProps();
    render(<SettingsPanel {...props} />);
    fireEvent.click(screen.getByText('Combined'));
    expect(props.onShiftModeChange).toHaveBeenCalledWith('combined');
  });

  it('calls onShiftModeChange with summer value', () => {
    const props = defaultProps();
    render(<SettingsPanel {...props} />);
    fireEvent.click(screen.getByText('Summer'));
    expect(props.onShiftModeChange).toHaveBeenCalledWith('summer');
  });

  it('renders theme select with correct value', () => {
    render(<SettingsPanel {...defaultProps()} />);
    const select = screen.getByDisplayValue('Neo-Kinetic');
    expect(select).toBeInTheDocument();
  });

  it('calls onThemeChange when theme changed', () => {
    const props = defaultProps();
    render(<SettingsPanel {...props} />);
    const select = screen.getByDisplayValue('Neo-Kinetic');
    fireEvent.change(select, { target: { value: 'harbor' } });
    expect(props.onThemeChange).toHaveBeenCalledWith('harbor');
  });

  it('renders light/dark mode toggle in light mode', () => {
    render(<SettingsPanel {...defaultProps()} />);
    expect(screen.getByText('☀ Ljust')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
  });

  it('renders light/dark mode toggle in dark mode', () => {
    render(<SettingsPanel {...defaultProps()} mode="dark" />);
    expect(screen.getByText('☾ Mörkt')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
  });

  it('calls onToggleMode when mode button clicked', () => {
    const props = defaultProps();
    render(<SettingsPanel {...props} />);
    fireEvent.click(screen.getByLabelText('Switch to dark mode'));
    expect(props.onToggleMode).toHaveBeenCalled();
  });

  it('renders visible weeks slider with correct value', () => {
    render(<SettingsPanel {...defaultProps()} />);
    const slider = screen.getByLabelText('Visible weeks: 12');
    expect(slider).toBeInTheDocument();
    expect(slider.value).toBe('12');
  });

  it('calls onVisibleWeeksChange when slider moved', () => {
    const props = defaultProps();
    render(<SettingsPanel {...props} />);
    const slider = screen.getByLabelText('Visible weeks: 12');
    fireEvent.change(slider, { target: { value: '8' } });
    expect(props.onVisibleWeeksChange).toHaveBeenCalledWith(8);
  });

  it('renders density buttons', () => {
    render(<SettingsPanel {...defaultProps()} />);
    expect(screen.getByText('Kmpkt')).toBeInTheDocument();
    expect(screen.getByText('Norm')).toBeInTheDocument();
    expect(screen.getByText('Rymlig')).toBeInTheDocument();
  });

  it('calls onDensityChange when density button clicked', () => {
    const props = defaultProps();
    render(<SettingsPanel {...props} />);
    fireEvent.click(screen.getByText('Kmpkt'));
    expect(props.onDensityChange).toHaveBeenCalledWith('compact');
  });

  it('renders grain slider', () => {
    render(<SettingsPanel {...defaultProps()} />);
    const slider = screen.getByLabelText('Grain intensity: 45%');
    expect(slider).toBeInTheDocument();
  });

  it('calls onGrainChange when grain slider moved', () => {
    const props = defaultProps();
    render(<SettingsPanel {...props} />);
    const slider = screen.getByLabelText('Grain intensity: 45%');
    fireEvent.change(slider, { target: { value: '0.2' } });
    expect(props.onGrainChange).toHaveBeenCalledWith(0.2);
  });

  it('renders asymmetry checkbox checked when asym is true', () => {
    render(<SettingsPanel {...defaultProps()} />);
    const checkbox = screen.getByLabelText('Enable micro-rotation asymmetry');
    expect(checkbox).toBeChecked();
  });

  it('calls onAsymChange when asymmetry checkbox toggled', () => {
    const props = defaultProps();
    render(<SettingsPanel {...props} />);
    const checkbox = screen.getByLabelText('Enable micro-rotation asymmetry');
    fireEvent.click(checkbox);
    expect(props.onAsymChange).toHaveBeenCalled();
  });
});
