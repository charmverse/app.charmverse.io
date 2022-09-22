import { useEditorViewContext } from '@bangle.dev/react';
import { Stack, Typography } from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import Button from 'components/common/Button';
import { DateTime } from 'luxon';
import { Box } from '@mui/system';
import { accept } from 'components/common/CharmEditor/fiduswriter/track/accept';
import { acceptAll } from 'components/common/CharmEditor/fiduswriter/track/acceptAll';
import { reject } from 'components/common/CharmEditor/fiduswriter/track/reject';
import { rejectAll } from 'components/common/CharmEditor/fiduswriter/track/rejectAll';
import { getTracksFromDoc } from 'components/common/CharmEditor/fiduswriter/track/getTracks';

export default function SuggestionsSidebar ({ readOnly }: { readOnly: boolean}) {
  const view = useEditorViewContext();

  const suggestions = getTracksFromDoc({ view });

  function clickAcceptAll () {
    acceptAll(view);
  }

  function clickRejectAll () {
    rejectAll(view);
  }

  function acceptOne (type: string, pos: number) {
    accept(type, pos, view);
  }

  function rejectOne (type: string, pos: number) {
    reject(type, pos, view);
  }

  return (
    <>
      {!readOnly && (
        <Box display='flex' gap={1} flexDirection='row' position='absolute' top={0} right={8}>
          <Button size='small' startIcon={<Check />} disableElevation variant='text' color='success' onClick={clickAcceptAll}>
            Accept All
          </Button>
          <Button size='small' startIcon={<Close />} disableElevation variant='text' color='error' onClick={clickRejectAll}>
            Reject All
          </Button>
        </Box>
      )}
      <Stack gap={2}>
        {suggestions.map(({ data, pos, type }) => {
          return (
            <Stack className='commit' key={pos} gap={1}>
              <Typography variant='subtitle2'>{data.date ? DateTime.fromJSDate(new Date(data.date)).toRelative({ base: (DateTime.now()) }) : 'N/A'}</Typography>
              <Typography>
                {type}
              </Typography>
              <Box display='flex' gap={1}>
                <Button
                  onClick={() => {
                    acceptOne(type, pos);
                  }}
                  size='small'
                  variant='outlined'
                >Approve
                </Button>
                <Button
                  size='small'
                  variant='outlined'
                  color='error'
                  onClick={() => {
                    rejectOne(type, pos);
                  }}
                >Reject
                </Button>
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </>
  );
}
