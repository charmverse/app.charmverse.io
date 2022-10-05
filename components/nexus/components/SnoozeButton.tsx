
import CancelIcon from '@mui/icons-material/Cancel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SnoozeIcon from '@mui/icons-material/Snooze';
import { Box, IconButton, Menu, MenuItem, TextField } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { DateTimePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import { bindMenu, bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useRef, useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useUser } from 'hooks/useUser';
import { humanFriendlyDate } from 'lib/utilities/dates';
import type { LoggedInUser } from 'models';

import useTasksState from '../hooks/useTasksState';

export default function SnoozeButton () {
  const { setUser } = useUser();
  const { isLoading, snoozedForDate, snoozedMessage, mutate: mutateTasks } = useTasksState();

  const isSnoozed = snoozedForDate !== null;

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [snoozeMessage, setSnoozeMessage] = useState(snoozedMessage);
  const [snoozedForValue, setSnoozedForValue] = useState<null | '1_day' | '3_days' | DateTime>(null);
  const dateInput = usePopupState({
    popupId: 'snooze-transactions',
    variant: 'popover'
  });
  const messageInput = usePopupState({
    popupId: 'snooze-transactions-message',
    variant: 'popover'
  });
  const dateTimePickerRef = useRef<HTMLDivElement>(null);

  function hideDateMenu () {
    setShowDatePicker(false);
    dateInput.close();
  }

  function hideMessageMenu () {
    setSnoozeMessage(null);
    messageInput.close();
  }

  function closeMenus () {
    hideMessageMenu();
    hideDateMenu();
  }

  function resetState () {
    setShowDatePicker(false);
    setSnoozeMessage(null);
    setSnoozedForValue(null);
  }

  async function removeSnoozedForDate () {
    resetState();
    setShowLoading(true);
    await charmClient.tasks.updateTasksState({
      snoozeFor: null,
      snoozeMessage: null
    });
    setUser((user: LoggedInUser) => ({
      ...user,
      notificationState: {
        snoozedUntil: null,
        snoozeMessage: null
      }
    }));
    await mutateTasks();
    setShowLoading(false);
  }

  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (snoozedForDate) {
      const currentTimestamp = Date.now();
      const snoozedForTimestamp = snoozedForDate.toJSDate().getTime();
      // If the snoozed time has passed
      if (snoozedForTimestamp < currentTimestamp) {
        removeSnoozedForDate();
      }
    }
  }, [snoozedForDate]);

  useEffect(() => {
    setSnoozeMessage(snoozedMessage);
  }, [snoozedMessage]);

  async function saveSnoozeState (_snoozeMessage: string | null) {
    resetState();
    setShowLoading(true);
    const newSnoozedForDate = getSnoozedDate();
    await charmClient.tasks.updateTasksState({
      snoozeFor: newSnoozedForDate.toJSDate(),
      snoozeMessage: _snoozeMessage
    });
    setUser((user: LoggedInUser) => ({ ...user,
      notificationState: {
        snoozedUntil: newSnoozedForDate.toString(),
        snoozeMessage: _snoozeMessage
      } }));
    await mutateTasks();
    setShowLoading(false);
  }

  function getSnoozedDate () {
    let newSnoozedForDate = DateTime.fromMillis(Date.now());
    switch (snoozedForValue) {
      case '1_day': {
        newSnoozedForDate = newSnoozedForDate.plus({ day: 1 });
        break;
      }
      case '3_days': {
        newSnoozedForDate = newSnoozedForDate.plus({ days: 3 });
        break;
      }
      default: {
        if (snoozedForValue instanceof DateTime) {
          newSnoozedForDate = snoozedForValue;
        }
        else if (snoozedForDate instanceof DateTime) {
          newSnoozedForDate = snoozedForDate;
        }
      }
    }
    return newSnoozedForDate;
  }

  useEffect(() => {
    if (showDatePicker && dateTimePickerRef.current) {
      setTimeout(() => {
        if (dateTimePickerRef.current) {
          const button = dateTimePickerRef.current.querySelector<HTMLButtonElement>('button');
          if (button) {
            button.click();
          }
        }
      }, 100);
    }
  }, [showDatePicker]);

  return (
    <div>
      <Box display='flex' alignItems='center' gap={0.5} justifyContent='flex-end' width='100%'>
        <Tooltip arrow placement='top' title={snoozedForDate ? `Snoozed until ${humanFriendlyDate(snoozedForDate, { withTime: true })}` : ''}>
          <Button
            color={snoozedForDate ? 'warning' : dateInput.isOpen ? 'primary' : 'secondary'}
            size='small'
            disableElevation
            loading={showLoading}
            variant='outlined'
            startIcon={(
              <SnoozeIcon
                fontSize='small'
              />
            )}
            sx={{ fontSize: { xs: '12px', sm: '14px' } }}
            {...bindTrigger(dateInput)}
          >
            {isSnoozed ? `Snoozed for ${snoozedForDate.toRelative({ base: (DateTime.now()) })?.slice(3)}` : 'Snooze'}
          </Button>
        </Tooltip>
        <Tooltip
          arrow
          placement='top'
          title='Let others know you are busy by snoozing'
          sx={{
            display: {
              xs: 'none',
              sm: 'initial'
            }
          }}
        >
          <InfoOutlinedIcon
            color='secondary'
            fontSize='small'
          />
        </Tooltip>
      </Box>

      <Menu
        {...bindMenu(dateInput)}
        sx={{
          '& .MuiPaper-root': {
            minWidth: showDatePicker ? 300 : 250
          }
        }}
      >
        <MenuItem
          onClick={() => {
            setSnoozedForValue('1_day');
            dateInput.close();
            messageInput.open();
            dateInput.close();
          }}
        >Snooze for 1 day
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSnoozedForValue('3_days');
            dateInput.close();
            messageInput.open();
            dateInput.close();
          }}
        >
          Snooze for 3 days
        </MenuItem>
        {showDatePicker
          ? (
            <Box display='flex' gap={1}>
              <DateTimePicker
                ref={dateTimePickerRef}
                minDate={DateTime.fromMillis(Date.now()).plus({ day: 1 })}
                value={DateTime.fromMillis(Date.now()).plus({ day: 1 })}
                onAccept={async (value) => {
                  if (value) {
                    setSnoozedForValue(value);
                    messageInput.open();
                    dateInput.close();
                  }
                }}
                onChange={() => {}}
                renderInput={(props) => (
                  <TextField
                    {...props}
                    inputProps={{
                      ...props.inputProps,
                      readOnly: true
                    }}
                    disabled
                    fullWidth
                  />
                )}
              />
              <IconButton
                color='error'
                onClick={() => {
                  setShowDatePicker(false);
                }}
              >
                <CancelIcon />
              </IconButton>
            </Box>
          )
          : (
            <MenuItem
              divider={isSnoozed}
              onClick={() => {
                setShowDatePicker(true);
              }}
            >Pick a date
            </MenuItem>
          )}
        {isSnoozed && (
          <MenuItem onClick={() => {
            // Close the menu and then update the state after a bit of delay
            closeMenus();
            removeSnoozedForDate();
          }}
          >
            Unsnooze
          </MenuItem>
        )}
        {isSnoozed && (
          <MenuItem onClick={messageInput.open}>
            Edit message
          </MenuItem>
        )}
      </Menu>
      <Modal {...bindPopover(messageInput)} title={`Snooze until ${humanFriendlyDate(getSnoozedDate())}`}>
        <TextField
          sx={{ mb: 2 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              closeMenus();
              saveSnoozeState(snoozeMessage);
            }
          }}
          autoFocus
          fullWidth
          multiline
          rows={3}
          placeholder='Leave an optional message'
          onChange={(e) => setSnoozeMessage(e.target.value)}
          value={snoozeMessage}
        />
        <Button onClick={() => {
          closeMenus();
          saveSnoozeState(snoozeMessage);
        }}
        >
          {isSnoozed ? 'Save Message' : 'Snooze notifications'}
        </Button>
      </Modal>
    </div>
  );
}
