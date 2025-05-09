import { Autocomplete, Box, TextField } from '@mui/material';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

import FieldLabel from 'components/common/form/FieldLabel';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { getTimezonesWithOffset, toHoursAndMinutes } from '@packages/lib/utils/dates';

export interface Timezone {
  tz: string;
  offset: string;
}

const timezoneOptions = getTimezonesWithOffset();

export function TimezoneAutocomplete({
  onChange,
  userTimezone,
  readOnly,
  required
}: {
  userTimezone?: string | null;
  onChange: (timezone?: string | null) => void;
  readOnly?: boolean;
  required?: boolean;
}) {
  const [tz, setTimezone] = useState<null | Timezone | undefined>(null);
  function setInitialTimezone() {
    setTimezone(
      userTimezone
        ? {
            // luxon provides the offset in terms of minutes
            offset: toHoursAndMinutes(DateTime.local().setZone(userTimezone).offset),
            tz: userTimezone
          }
        : null
    );
  }

  useEffect(() => {
    setInitialTimezone();
  }, [userTimezone]);

  const currentTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const currentTzOffset = toHoursAndMinutes(DateTime.local().offset);

  return (
    <FieldWrapper label='Timezone' required={required}>
      <Autocomplete<Timezone>
        fullWidth
        disabled={readOnly}
        value={tz}
        isOptionEqualToValue={(option, value) => option.tz === value.tz && option.offset === value.offset}
        onChange={(_, selectOption) => {
          setTimezone(selectOption);
          onChange(selectOption?.tz);
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
        getOptionLabel={(option) => `${option.tz} (GMT ${option.offset})`}
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
    </FieldWrapper>
  );
}
