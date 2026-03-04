import { logEvent } from 'firebase/analytics';
import { describe, expect, it, vi } from 'vitest';

import { analytics } from '../../firebase';

// Unmock the global mock from setupTests.ts
vi.unmock('../../utils/analytics');

// We still need to import it AFTER unmocking
import { Analytics } from '../../utils/analytics';

// Override the firebase mock for this test
vi.mock('../../firebase', () => ({
  analytics: { mock: 'analytics' },
  app: {},
}));

describe('Analytics', () => {
  it('should call logEvent when tracking button click', () => {
    const buttonName = 'test_button';
    Analytics.trackButtonClick(buttonName);
    expect(logEvent).toHaveBeenCalledWith(analytics, 'button_click', { button_name: buttonName });
  });

  it('should call logEvent when tracking navigation', () => {
    const destination = '/map';
    Analytics.trackNavigation(destination);
    expect(logEvent).toHaveBeenCalledWith(analytics, 'navigation', { destination });
  });

  it('should call logEvent when tracking section toggle', () => {
    Analytics.trackSectionToggle('stations', true);
    expect(logEvent).toHaveBeenCalledWith(analytics, 'section_toggle', {
      section: 'stations',
      is_open: true,
    });
  });

  it('should call logEvent when tracking theme change', () => {
    Analytics.trackThemeChange('dark');
    expect(logEvent).toHaveBeenCalledWith(analytics, 'theme_change', { theme: 'dark' });
  });

  it('should call logEvent when tracking location request', () => {
    Analytics.trackLocationRequest(true);
    expect(logEvent).toHaveBeenCalledWith(analytics, 'location_request', { granted: true });
  });

  it('should call logEvent when tracking map interaction', () => {
    Analytics.trackMapInteraction('zoom_in');
    expect(logEvent).toHaveBeenCalledWith(analytics, 'map_interaction', { action: 'zoom_in' });
  });

  it('should call logEvent when tracking fuel type change', () => {
    Analytics.trackFuelTypeChange('98');
    expect(logEvent).toHaveBeenCalledWith(analytics, 'fuel_type_change', { fuel_type: '98' });
  });

  it('should call logEvent when tracking external link', () => {
    const url = 'https://google.com';
    Analytics.trackExternalLink(url);
    expect(logEvent).toHaveBeenCalledWith(analytics, 'external_link', { url });
  });

  it('should call logEvent when tracking station view', () => {
    Analytics.trackStationView('abc');
    expect(logEvent).toHaveBeenCalledWith(analytics, 'station_view', { station_id: 'abc' });
  });
});
