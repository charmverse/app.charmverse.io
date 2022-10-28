import { Autocomplete, Box, Stack, TextField } from '@mui/material';
import { DateTime } from 'luxon';
import { useEffect, useMemo, useState } from 'react';
import { zones } from 'tzdata';

import Button from 'components/common/Button';
import Modal, { DialogTitle } from 'components/common/Modal';
import { toHoursAndMinutes } from 'lib/utilities/dates';

interface Timezone {
  tz: string;
  offset: string;
}

export default function TimezoneModal ({
  close,
  isOpen,
  onSave,
  initialTimezone
}: {
  onSave: (timezone: string | null) => void;
  isOpen: boolean;
  close: VoidFunction;
  initialTimezone?: string | null;
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

  const [timezone, setTimezone] = useState<null | Timezone | undefined>(null);

  function updateTimezone () {
    setTimezone(initialTimezone ? {
      tz: initialTimezone,
      // luxon provides the offset in terms of minutes
      offset: toHoursAndMinutes(DateTime.local().setZone(initialTimezone).offset)
    } : null);
  }

  useEffect(() => {
    updateTimezone();
  }, [initialTimezone]);

  function onClose () {
    close();
    updateTimezone();
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size='large'
    >
      <DialogTitle onClose={onClose}>Setup your timezone</DialogTitle>
      <form onSubmit={(e) => {
        e.preventDefault();
        onSave(timezone?.tz ?? null);
        close();
      }}
      >
        <Stack gap={1}>
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
          <Button type='submit'>
            Update
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
