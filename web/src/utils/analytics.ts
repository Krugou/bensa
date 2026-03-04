import { logEvent } from 'firebase/analytics';

import { analytics } from '../firebase';

/**
 * Analytics utility for tracking user interactions
 */
export const Analytics = {
  trackButtonClick: (buttonName: string) => {
    if (analytics) logEvent(analytics, 'button_click', { button_name: buttonName });
  },

  trackNavigation: (destination: string) => {
    if (analytics) logEvent(analytics, 'navigation', { destination });
  },

  trackSectionToggle: (section: string, isOpen: boolean) => {
    if (analytics) logEvent(analytics, 'section_toggle', { section, is_open: isOpen });
  },

  trackThemeChange: (theme: string) => {
    if (analytics) logEvent(analytics, 'theme_change', { theme });
  },

  trackLanguageChange: (language: string) => {
    if (analytics) logEvent(analytics, 'language_change', { language });
  },

  trackFuelTypeChange: (fuelType: string) => {
    if (analytics) logEvent(analytics, 'fuel_type_change', { fuel_type: fuelType });
  },

  trackStationView: (stationId: string) => {
    if (analytics) logEvent(analytics, 'station_view', { station_id: stationId });
  },

  trackLocationRequest: (granted: boolean) => {
    if (analytics) logEvent(analytics, 'location_request', { granted });
  },

  trackNotificationPermission: (granted: boolean) => {
    if (analytics) logEvent(analytics, 'notification_permission', { granted });
  },

  trackExternalLink: (url: string) => {
    if (analytics) logEvent(analytics, 'external_link', { url });
  },

  trackMapInteraction: (action: string) => {
    if (analytics) logEvent(analytics, 'map_interaction', { action });
  },
};
