import { useEditorViewContext } from '@bangle.dev/react';
import { Commit, getChangeSummary } from '@manuscripts/track-changes';
import { Stack, Typography } from '@mui/material';
import { DateTime } from 'luxon';

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
  const { state } = useEditorViewContext();

  const commits = suggestion ? smoosh(suggestion, (c) => ({ updatedAt: c.updatedAt, _id: c._id, changeID: c.changeID })) : [];
  return (
    <div>
      <strong>Edit suggestions:</strong>
      <Stack gap={1}>
        {commits.map(({ updatedAt, _id, changeID }) => {
          return (
            <Stack className='commit' key={_id}>
              <Typography variant='subtitle2'>{updatedAt ? DateTime.fromJSDate(new Date(updatedAt)).toRelative({ base: (DateTime.now()) }) : 'N/A'}</Typography>
              <Typography>
                {getChangeSummary(state, changeID)?.insertion}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </div>
  );
}
