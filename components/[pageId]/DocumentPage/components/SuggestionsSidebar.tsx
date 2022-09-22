import { useEditorViewContext } from '@bangle.dev/react';
import { Stack, Typography } from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import Button from 'components/common/Button';
import { DateTime } from 'luxon';
import { Box } from '@mui/system';
import { usePages } from 'hooks/usePages';
import charmClient from 'charmClient';
import type { EditorState } from 'prosemirror-state';
import { acceptAll } from 'components/common/CharmEditor/fiduswriter/track/acceptAll';
import { rejectAll } from 'components/common/CharmEditor/fiduswriter/track/rejectAll';

export default function SuggestionsSidebar () {
  const view = useEditorViewContext();
  const { state, update } = view;
  const { currentPageId, setPages } = usePages();

  // The track changes plugin generates an in progress commit with current changes. We always want to ignore this, so we start with commit n-1
  const commits = [];// suggestions?.prev ? smoosh(suggestions.prev, (c) => ({ updatedAt: c.updatedAt, _id: c._id, changeID: c.changeID })) : [];

  function approveSuggestion (changeID: string) {
    const { commit: next, mapping } = rebases.without(commit, [changeID]);
    let newState: EditorState = state;
    if (next) {
      newState = checkout(state.doc, state, next, mapping);
    }
    charmClient.updatePage({
      id: currentPageId,
      content: newState.doc.toJSON()
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
        content: newState.doc.toJSON()
      }).then((newPage) => {
        view.updateState(newState);
        setPages((pages) => ({ ...pages, [newPage.id]: newPage }));
      });
    }
  }

  function clickAcceptAll () {
    acceptAll(view);
  }

  function clickRejectAll () {
    rejectAll(view);
  }

  return (
    <>
      <Box display='flex' gap={1} flexDirection='row' position='absolute' top={0} right={8}>
        <Button size='small' startIcon={<Check />} disableElevation variant='text' color='success' onClick={clickAcceptAll}>
          Accept All
        </Button>
        <Button size='small' startIcon={<Close />} disableElevation variant='text' color='error' onClick={clickRejectAll}>
          Reject All
        </Button>
      </Box>
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
    </>
  );
}
