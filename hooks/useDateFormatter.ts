import { useMemo } from 'react';

import { useUserPreferences } from 'hooks/useUserPreferences';
import type { DateFormatConfig } from 'lib/utilities/dates';
import { formatDate, formatDateTime, getFormattedDateTime } from 'lib/utilities/dates';

export function useDateFormatter(locale?: string) {
  const { userPreferences } = useUserPreferences();
  const localeToUse = locale ?? userPreferences.locale;

  return useMemo(() => {
    return {
      formatDateTime: (dateInput: Date | string) => formatDateTime(dateInput, localeToUse),
      formatDate: (dateInput: Date | string, config?: DateFormatConfig) => formatDate(dateInput, config, localeToUse),
      formatTime: (dateInput: Date | string) => getFormattedDateTime(dateInput, { timeStyle: 'short' }, localeToUse)
    };
  }, [userPreferences]);
}
