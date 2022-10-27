import { Autocomplete, Box, Stack, TextField } from '@mui/material';
import * as moment from 'moment-timezone';
import { useEffect, useMemo, useState } from 'react';

import Button from 'components/common/Button';
import Modal, { DialogTitle } from 'components/common/Modal';

interface Timezone {
  tz: string;
  offset: string;
}

const getTimeZoneOptions = () => {
  const timeZones = moment.tz.names();
  const offsetTmz: Timezone[] = [];

  timeZones.forEach(timeZone => {
    const tzOffset = moment.tz(timeZone).format('Z');
    offsetTmz.push({
      offset: tzOffset,
      tz: timeZone
    });
  });

  return offsetTmz;
};

export function TimezoneModal ({
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
  const currentTzOffset = moment.tz(currentTz).format('Z');

  const timezoneOptions = useMemo(() => getTimeZoneOptions(), []);
  const [timezone, setTimezone] = useState<null | Timezone | undefined>(initialTimezone ? {
    tz: initialTimezone,
    offset: moment.tz(initialTimezone).format('Z')
  } : null);

  useEffect(() => {
    if (initialTimezone) {
      setTimezone({
        tz: initialTimezone,
        offset: moment.tz(initialTimezone).format('Z')
      });
    }
  }, [initialTimezone]);

  function onClose () {
    close();
    setTimezone(initialTimezone ? {
      tz: initialTimezone,
      offset: moment.tz(initialTimezone).format('Z')
    } : null);
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
                  {option.tz} GMT({option.offset})
                </Box>
              </Box>
            )}
            getOptionLabel={option => `${option.tz} GMT(${option.offset})`}
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
