import { Stack } from '@mui/material';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

import Button from 'components/common/Button';
import Modal, { DialogTitle } from 'components/common/Modal';
import { toHoursAndMinutes } from 'lib/utilities/dates';

import type { Timezone } from './TimezoneAutocomplete';
import { TimezoneAutocomplete } from './TimezoneAutocomplete';

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
  const [timezone, setTimezone] = useState<null | Timezone | undefined>(null);

  function setInitialTimezone () {
    setTimezone(initialTimezone ? {
      tz: initialTimezone,
      // luxon provides the offset in terms of minutes
      offset: toHoursAndMinutes(DateTime.local().setZone(initialTimezone).offset)
    } : null);
  }

  useEffect(() => {
    setInitialTimezone();
  }, [initialTimezone]);

  function onClose () {
    close();
    setInitialTimezone();
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size='large'
    >
      <DialogTitle onClose={onClose}>Set up your timezone</DialogTitle>
      <form onSubmit={(e) => {
        e.preventDefault();
        onSave(timezone?.tz ?? null);
        close();
      }}
      >
        <Stack gap={1}>
          <TimezoneAutocomplete
            setTimezone={setTimezone}
            timezone={timezone}
          />
          <Button
            fullWidth
            type='submit'
            sx={{
              width: 'fit-content'
            }}
          >
            Update
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
