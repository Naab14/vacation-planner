import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Settings from '../modules/Settings';

describe('Settings', () => {
  it('edits planning and staffing settings', () => {
    const onUpdateSettings = vi.fn();
    render(
      <Settings
        settings={{ planningYear: 2026, visibleWeeks: 12, startWeek: 15, minStaffing: 1, allowedOverlap: 2, lockedWeeks: [30] }}
        onUpdateSettings={onUpdateSettings}
      />,
    );
    fireEvent.change(screen.getByLabelText('Planning year'), { target: { value: '2027' } });
    expect(onUpdateSettings).toHaveBeenCalledWith({ planningYear: 2027 });
    fireEvent.change(screen.getByLabelText('Allowed overlap'), { target: { value: '3' } });
    expect(onUpdateSettings).toHaveBeenCalledWith({ allowedOverlap: 3 });
    fireEvent.change(screen.getByLabelText('Locked weeks'), { target: { value: '28, 29' } });
    expect(onUpdateSettings).toHaveBeenCalledWith({ lockedWeeks: [28, 29] });
  });
});
