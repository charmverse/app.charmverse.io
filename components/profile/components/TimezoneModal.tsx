import { Autocomplete, Box, Stack, TextField } from '@mui/material';
import * as moment from 'moment-timezone';
import { useMemo, useState } from 'react';

import Button from 'components/common/Button';
import Modal, { DialogTitle } from 'components/common/Modal';

type SelectOption = {
  label: string;
  value: string;
}

const getTimeZoneOptions = (showTimezoneOffset: boolean = true) => {
  const timeZones = moment.tz.names();
  const offsetTmz: SelectOption[] = [];

  timeZones.forEach(timeZone => {
    const tzOffset = moment.tz(timeZone).format('Z');
    const value: string = parseInt(
      tzOffset
        .replace(':00', '.00')
        .replace(':15', '.25')
        .replace(':30', '.50')
        .replace(':45', '.75')
    ).toFixed(2);

    const timeZoneOption: SelectOption = {
      label: showTimezoneOffset ? `${timeZone} (GMT${tzOffset})` : timeZone,
      value
    };

    offsetTmz.push(timeZoneOption);
  });

  return offsetTmz;
};

export function TimezoneModal ({
  close,
  isOpen
}: {
  isOpen: boolean;
  close: VoidFunction;
}) {

  const timezoneOptions = useMemo(() => getTimeZoneOptions(), []);
  const [timezone, setTimezone] = useState<null | SelectOption>(null);
  return (
    <Modal
      open={isOpen}
      onClose={close}
      size='large'
    >
      <DialogTitle onClose={close}>Setup your timezone</DialogTitle>
      <Stack gap={1}>
        <Autocomplete<SelectOption>
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
                {option.label}
              </Box>
            </Box>
          )}
          getOptionLabel={option => option.label}
          renderInput={(params) => (
            <TextField
              {...params}
              inputProps={{
                ...params.inputProps
              }}
            />
          )}
        />
        <Button>
          Update
        </Button>
      </Stack>
    </Modal>
  );
}
