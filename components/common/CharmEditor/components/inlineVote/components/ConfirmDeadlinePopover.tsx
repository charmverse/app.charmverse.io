import Popover from '@mui/material/Popover';
import type { PopoverProps } from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import { StaticDateTimePicker } from '@mui/x-date-pickers/StaticDateTimePicker';
import { DateTime } from 'luxon';
import { useState } from 'react';

type ConfirmDeadlineProps = PopoverProps & {
  initialDeadline: Date;
  updateDeadline: (deadline: Date) => Promise<void>;
};

export default function ConfirmDeadlinePopover({
  updateDeadline,
  initialDeadline,
  ...restProps
}: ConfirmDeadlineProps) {
  const [deadline, setDeadline] = useState(DateTime.fromJSDate(new Date(initialDeadline)));

  return (
    <Popover anchorOrigin={{ vertical: 'top', horizontal: 'right' }} {...restProps}>
      <StaticDateTimePicker
        openTo='day'
        displayStaticWrapperAs='desktop'
        minDate={DateTime.fromMillis(Date.now())}
        value={deadline}
        onChange={(value) => {
          if (value) {
            setDeadline(value);
          }
        }}
        onAccept={async (value) => {
          if (value) {
            await updateDeadline(value.toJSDate());
          }
        }}
        renderInput={(params) => <TextField {...params} />}
      />
    </Popover>
  );
}
