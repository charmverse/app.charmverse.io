import { Autocomplete, Box, TextField } from '@mui/material';
import { DateTime } from 'luxon';

import { getTimezonesWithOffset, toHoursAndMinutes } from 'lib/utilities/dates';

export interface Timezone {
  tz: string;
  offset: string;
}

const timezoneOptions = getTimezonesWithOffset();

export function TimezoneAutocomplete ({
  setTimezone,
  timezone
}: {
  timezone?: Timezone | null;
  setTimezone: (timezone: Timezone | null) => void;
}) {
  const currentTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const currentTzOffset = toHoursAndMinutes(DateTime.local().offset);

  return (
    <Autocomplete<Timezone>
      fullWidth
      value={timezone}
      onChange={(_, selectOption) => {
        setTimezone(selectOption);
      }}
      options={timezoneOptions}
      size='small'
      renderOption={(props, option) => (
        <Box component='li' sx={{ display: 'flex', gap: 1 }} {...props}>
          <Box component='span'>
            {option.tz} (GMT {option.offset})
          </Box>
        </Box>
      )}
      getOptionLabel={option => `${option.tz} (GMT ${option.offset})`}
      renderInput={(params) => (
        <TextField
          {...params}
          inputProps={{
            ...params.inputProps
          }}
          placeholder={`${currentTz} (${currentTzOffset})`}
        />
      )}
    />
  );
}
