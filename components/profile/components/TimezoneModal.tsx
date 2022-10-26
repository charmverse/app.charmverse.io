import { Autocomplete, Box, Stack, TextField } from '@mui/material';
import * as moment from 'moment-timezone';
import { useEffect, useMemo, useState } from 'react';

import Button from 'components/common/Button';
import Modal, { DialogTitle } from 'components/common/Modal';

const getTimeZoneOptions = () => {
  const timeZones = moment.tz.names();
  const offsetTmz: string[] = [];

  timeZones.forEach(timeZone => {
    const tzOffset = moment.tz(timeZone).format('Z');
    offsetTmz.push(`${timeZone} (GMT${tzOffset})`);
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

  const timezoneOptions = useMemo(() => getTimeZoneOptions(), []);
  const [timezone, setTimezone] = useState<null | string | undefined>(initialTimezone);

  useEffect(() => {
    if (initialTimezone) {
      setTimezone(initialTimezone);
    }
  }, [initialTimezone]);

  function onClose () {
    close();
    setTimezone(initialTimezone);
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
        onSave(timezone ?? null);
        close();
      }}
      >
        <Stack gap={1}>
          <Autocomplete<string>
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
                  {option}
                </Box>
              </Box>
            )}
            getOptionLabel={option => option}
            renderInput={(params) => (
              <TextField
                {...params}
                inputProps={{
                  ...params.inputProps
                }}
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
