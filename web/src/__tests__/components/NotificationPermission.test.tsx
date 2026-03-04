import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationPermission } from '../../components/NotificationPermission';

describe('NotificationPermission', () => {
  const mockNotification = {
    permission: 'default' as NotificationPermission,
    requestPermission: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal('Notification', mockNotification);
    mockNotification.permission = 'default';
    vi.clearAllMocks();
  });

  it('should render permission prompt when permission is default', () => {
    render(<NotificationPermission />);
    expect(screen.getByText('Get price drop alerts')).toBeDefined();
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('should handle successful permission request', async () => {
    mockNotification.requestPermission.mockResolvedValue('granted');

    render(<NotificationPermission />);

    const button = screen.getByRole('button');
    act(() => {
      fireEvent.click(button);
    });

    expect(mockNotification.requestPermission).toHaveBeenCalled();
    // After granted, it should show the enabled state
    expect(await screen.findByText('Price drop alerts enabled')).toBeDefined();
  });

  it('should handle denied permission request', async () => {
    mockNotification.requestPermission.mockResolvedValue('denied');

    render(<NotificationPermission />);

    const button = screen.getByRole('button');
    act(() => {
      fireEvent.click(button);
    });

    expect(mockNotification.requestPermission).toHaveBeenCalled();
    expect(await screen.findByText('Notifications blocked')).toBeDefined();
  });

  it('should show enabled state if already granted', () => {
    mockNotification.permission = 'granted';
    render(<NotificationPermission />);
    expect(screen.getByText('Price drop alerts enabled')).toBeDefined();
  });

  it('should show denied state if already denied', () => {
    mockNotification.permission = 'denied';
    render(<NotificationPermission />);
    expect(screen.getByText('Notifications blocked')).toBeDefined();
  });
});
