import { Check, Close, RateReviewOutlined } from '@mui/icons-material';
import { Box, Stack } from '@mui/material';
import type { EditorState } from 'prosemirror-state';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { activateTrack } from 'components/common/CharmEditor/components/fiduswriter/state_plugins/track/helpers';
import { acceptAll } from 'components/common/CharmEditor/components/fiduswriter/track/acceptAll';
import { rejectAll } from 'components/common/CharmEditor/components/fiduswriter/track/rejectAll';
import type { TrackedEvent } from 'components/common/CharmEditor/components/suggestions/getEvents';
import { getEventsFromDoc } from 'components/common/CharmEditor/components/suggestions/getEvents';
import { SuggestionCard } from 'components/common/CharmEditor/components/suggestions/SuggestionCard';
import { useCharmEditorView } from 'hooks/useCharmEditorView';
import { useUser } from 'hooks/useUser';

import { NoCommentsMessage } from './CommentsSidebar';

export function SuggestionsSidebar({
  readOnly,
  state,
  pageId,
  spaceId
}: {
  readOnly: boolean;
  state?: EditorState | null;
  pageId: string;
  spaceId: string;
}) {
  const { view } = useCharmEditorView();

  const { user } = useUser();
  const [suggestions, setSuggestions] = useState<TrackedEvent[]>([]);

  // listen to changes on the doc like when suggestions are added/deleted
  useEffect(() => {
    const marks = view
      ? getEventsFromDoc({ state: view.state })
          .map((r) => r.marks)
          .flat()
      : [];
    setSuggestions(marks);
  }, [view?.state.doc]);

  // listen to changes from selection (see CharmEditor)
  useEffect(() => {
    if (state) {
      const marks = getEventsFromDoc({ state })
        .map((r) => r.marks)
        .flat();
      setSuggestions(marks);
    }
  }, [state]);

  // console.log('suggestions', suggestions);

  function clickAcceptAll() {
    if (!view) return;
    acceptAll(view);
    charmClient.track.trackAction('page_suggestion_accepted', { pageId, spaceId });
  }

  function clickRejectAll() {
    if (!view) return;
    rejectAll(view);
  }

  function highlightMark(mark: TrackedEvent) {
    if (!view) return;
    activateTrack(view, mark.type, mark.pos);
  }

  return (
    <Box display='flex' gap={1} flexDirection='column' px={1} height='100%'>
      {!readOnly && suggestions.length > 0 && (
        <Box display='flex' gap={1} flexDirection='row'>
          <Button
            size='small'
            startIcon={<Check />}
            disableElevation
            variant='text'
            color='secondary'
            onClick={clickAcceptAll}
          >
            Accept All
          </Button>
          <Button
            size='small'
            startIcon={<Close />}
            disableElevation
            variant='text'
            color='secondary'
            onClick={clickRejectAll}
          >
            Reject All
          </Button>
        </Box>
      )}
      {suggestions.length > 0 && (
        <Stack gap={2}>
          {suggestions.map((mark) => (
            <div onClick={() => highlightMark(mark)} key={mark.pos}>
              <SuggestionCard
                key={mark.pos + mark.type}
                {...mark}
                pageId={pageId}
                spaceId={spaceId}
                readOnly={readOnly}
                isOwner={mark.data.user === user?.id}
              />
            </div>
          ))}
        </Stack>
      )}
      {suggestions.length === 0 && (
        <NoCommentsMessage
          icon={
            <RateReviewOutlined
              fontSize='large'
              color='secondary'
              sx={{
                height: '2em',
                width: '2em'
              }}
            />
          }
          message='No suggestions yet'
        />
      )}
    </Box>
  );
}
