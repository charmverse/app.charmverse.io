import { useEditorViewContext } from '@bangle.dev/react';
import { checkout, Commit, getChangeSummary, getTrackPluginState, rebases } from '@manuscripts/track-changes';
import { Button, Stack, Typography } from '@mui/material';
import { DateTime } from 'luxon';
import { Box } from '@mui/system';

export function smoosh<T> (
  commit: Commit,
  selector: (commit: Commit) => T | Array<T>
): Array<T> {
  const getFromSelector = () => {
    const result = selector(commit);
    return Array.isArray(result) ? result : [result];
  };
  if (commit.prev) {
    return smoosh(commit.prev, selector).concat(getFromSelector());
  }
  return getFromSelector();
}

export default function SuggestionsSidebar ({ suggestion }: {suggestion: Commit}) {
  const view = useEditorViewContext();
  const { state, update } = view;
  const { commit } = getTrackPluginState(state);

  // The track changes plugin generates an in progress commit with current changes. We always want to ignore this, so we start with commit n-1
  const commits = suggestion?.prev ? smoosh(suggestion.prev, (c) => ({ updatedAt: c.updatedAt, _id: c._id, changeID: c.changeID })) : [];

  return (
    <div>
      <strong>Edit suggestions:</strong>
      <Stack gap={2}>
        {commits.map(({ updatedAt, _id, changeID }) => {
          return (
            <Stack className='commit' key={_id} gap={1}>
              <Typography variant='subtitle2'>{updatedAt ? DateTime.fromJSDate(new Date(updatedAt)).toRelative({ base: (DateTime.now()) }) : 'N/A'}</Typography>
              <Typography>
                {getChangeSummary(state, changeID)?.insertion}
              </Typography>
              <Box display='flex' gap={1}>
                <Button
                  onClick={() => {
                    const { commit: next, mapping } = rebases.without(commit, [changeID]);
                    if (next) {
                      view.updateState(checkout(state.doc, state, next, mapping));
                    }
                  }}
                  size='small'
                  variant='outlined'
                >Approve
                </Button>
                <Button
                  size='small'
                  variant='outlined'
                  color='error'
                >Reject
                </Button>
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </div>
  );
}
