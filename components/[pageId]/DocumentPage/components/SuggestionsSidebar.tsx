import { useEditorViewContext } from '@bangle.dev/react';
import { checkout, Commit, commitToJSON, findCommitWithin, getChangeSummary, getTrackPluginState, rebases, reverseMapping } from '@manuscripts/track-changes';
import { Button, Stack, Typography } from '@mui/material';
import { DateTime } from 'luxon';
import { Box } from '@mui/system';
import { usePages } from 'hooks/usePages';
import charmClient from 'charmClient';
import { Prisma } from '@prisma/client';
import { EditorState } from 'prosemirror-state';

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
  const { currentPageId, setPages } = usePages();
  const { commit } = getTrackPluginState(state);

  // The track changes plugin generates an in progress commit with current changes. We always want to ignore this, so we start with commit n-1
  const commits = suggestion?.prev ? smoosh(suggestion.prev, (c) => ({ updatedAt: c.updatedAt, _id: c._id, changeID: c.changeID })) : [];

  function approveSuggestion (changeID: string) {
    const { commit: next, mapping } = rebases.without(commit, [changeID]);
    let newState: EditorState = state;
    if (next) {
      newState = checkout(state.doc, state, next, mapping);
    }
    charmClient.updatePage({
      id: currentPageId,
      content: newState.doc.toJSON(),
      suggestions: next ? commitToJSON(next, '') as any : null
    }).then((newPage) => {
      view.updateState(newState);
      setPages((pages) => ({ ...pages, [newPage.id]: newPage }));
    });
  }

  function rejectSuggestion (changeID: string) {
    const { commit: next, mapping } = rebases.without(commit, [changeID]);

    const rejectedCommit = findCommitWithin(commit)(changeID);

    if (rejectedCommit) {

      const deleteRange = [rejectedCommit.steps[0].toJSON().from, rejectedCommit.steps[rejectedCommit.steps.length - 1].toJSON().to];

      const stateWithChangeRemoved = view.state.apply(view.state.tr.delete(deleteRange[0], deleteRange[1] + 1));

      const newState: EditorState = checkout(stateWithChangeRemoved.doc, stateWithChangeRemoved, next as any, mapping);

      charmClient.updatePage({
        id: currentPageId,
        content: newState.doc.toJSON(),
        suggestions: next ? commitToJSON(next, '') as any : null
      }).then((newPage) => {
        view.updateState(newState);
        setPages((pages) => ({ ...pages, [newPage.id]: newPage }));
      });
    }
  }

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
                    approveSuggestion(changeID);
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
                    rejectSuggestion(changeID);
                  }}
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
