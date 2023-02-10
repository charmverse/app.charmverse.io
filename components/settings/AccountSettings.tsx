import { InputLabel, MenuItem, Select } from '@mui/material';
import { Box } from '@mui/system';

import Legend from 'components/settings/Legend';
import { useUserPreferences } from 'hooks/useUserPreferences';
import { formatDateTime } from 'lib/utilities/dates';

export function AccountSettings() {
  const { userPreferences, updatePreferences } = useUserPreferences();

  const updateLocale = (locale: string) => {
    updatePreferences({ locale });
  };

  return (
    <Box mb={2}>
      <Legend>My Account</Legend>
      <Box display='flex' gap={0.5} flexDirection='column'>
        <InputLabel>Preferred date and time format:</InputLabel>
        <div>
          <Select
            value={userPreferences.locale || ''}
            displayEmpty
            onChange={(e) => updateLocale(e.target.value as string)}
          >
            <MenuItem value=''>My native format ({formatDateTime(new Date())})</MenuItem>
            <MenuItem value='en-US'>American English format ({formatDateTime(new Date(), 'en-US')})</MenuItem>
            <MenuItem value='en-GB'>European English format ({formatDateTime(new Date(), 'en-GB')})</MenuItem>
          </Select>
        </div>
      </Box>
    </Box>
  );
}
