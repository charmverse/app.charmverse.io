import { Autocomplete, Box, TextField } from '@mui/material';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { zones } from 'tzdata';

import { toHoursAndMinutes } from 'lib/utilities/dates';

export interface Timezone {
  tz: string;
  offset: string;
}

export function TimezoneAutocomplete ({
  setTimezone,
  timezone
}: {
  timezone?: Timezone | null;
  setTimezone: (timezone: Timezone | null) => void;
}) {
  const currentTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const currentTzOffset = toHoursAndMinutes(DateTime.local().offset);

  const timezoneOptions = useMemo(() => {
    // Code copied from https://github.com/moment/luxon/issues/353#issuecomment-514203601
    const luxonValidTimezones = Object.entries(zones)
      .filter(([, v]) => Array.isArray(v))
      .map(([zoneName]) => zoneName)
      .filter(tz => DateTime.local().setZone(tz).isValid);

    return luxonValidTimezones.map(timeZone => {
      const tzOffset = DateTime.local().setZone(timeZone).offset;
      return {
        offset: toHoursAndMinutes(tzOffset),
        tz: timeZone
      };
    });
  }, []);

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
            {option.tz} (GMT{option.offset})
          </Box>
        </Box>
      )}
      getOptionLabel={option => `${option.tz} (GMT${option.offset})`}
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
