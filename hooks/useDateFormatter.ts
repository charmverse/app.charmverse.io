import { useMemo } from 'react';

import { useUserPreferences } from 'hooks/useUserPreferences';

type FormatConfig = {
  locale?: string;
};

export function useDateFormatter() {
  const { userPreferences } = useUserPreferences();

  return useMemo(() => {
    return {
      getFormattedDateTime: (dateInput: Date | string) =>
        getFormattedDateTime(dateInput, { locale: userPreferences.locale }),
      getFormattedDate: (dateInput: Date | string) => getFormattedDate(dateInput, { locale: userPreferences.locale }),
      getFormattedTime: (dateInput: Date | string) => getFormattedTime(dateInput, { locale: userPreferences.locale })
    };
  }, [userPreferences]);
}

function getFormattedDateTime(dateInput: Date | string, config?: FormatConfig) {
  const date = new Date(dateInput);

  // TODO - more formatting options
  return date.toLocaleString(config?.locale || 'default');
}

function getFormattedDate(dateInput: Date | string, config?: FormatConfig) {
  const date = new Date(dateInput);

  // TODO - more formatting options
  return date.toLocaleDateString(config?.locale || 'default');
}

function getFormattedTime(dateInput: Date | string, config?: FormatConfig) {
  const date = new Date(dateInput);

  // TODO - more formatting options
  return date.toLocaleTimeString(config?.locale || 'default');
}
