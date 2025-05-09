import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type { ReactNode } from 'react';

import { useUserPreferences } from 'hooks/useUserPreferences';

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const { userPreferences } = useUserPreferences();
  return (
    <MuiLocalizationProvider dateAdapter={AdapterLuxon} adapterLocale={userPreferences.locale ?? undefined}>
      {children}
    </MuiLocalizationProvider>
  );
}
