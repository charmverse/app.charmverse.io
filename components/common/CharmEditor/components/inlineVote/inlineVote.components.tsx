import { PluginKey, TextSelection } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { hideSelectionTooltip } from '@bangle.dev/tooltip/selection-tooltip';
import { ClickAwayListener, Grow, IconButton, TextField } from '@mui/material';
import { Box, darken, lighten, useTheme } from '@mui/system';
import { DateTimePicker } from '@mui/x-date-pickers';
import Button from 'components/common/Button';
import { usePages } from 'hooks/usePages';
import { PageContent } from 'models';
import { useState } from 'react';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import CancelIcon from '@mui/icons-material/Cancel';
import FieldLabel from 'components/common/form/FieldLabel';
import InlineCharmEditor from '../../InlineCharmEditor';
import { checkForEmpty } from '../../utils';
import { updateInlineVote } from './inlineVote.utils';

export function InlineVoteSubMenu ({ pluginKey }: {pluginKey: PluginKey}) {
  const view = useEditorViewContext();
  const theme = useTheme();
  const [voteTitle, setVoteTitle] = useState('');
  const [voteDescription, setVoteDescription] = useState<PageContent>({
    type: 'doc',
    content: [
      {
        type: 'paragraph'
      }
    ]
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deadline, setDeadline] = useState(DateTime.fromMillis(Date.now()));
  const { currentPageId } = usePages();
  const isEmpty = checkForEmpty(voteDescription);
  const handleSubmit = async (e: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (!isEmpty) {
      const cardId = typeof window !== 'undefined' ? (new URLSearchParams(window.location.href)).get('cardId') : null;
      e.preventDefault();
      updateInlineVote(v4())(view.state, view.dispatch);
      hideSelectionTooltip(pluginKey)(view.state, view.dispatch, view);
      const tr = view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$to.pos)));
      view.dispatch(tr);
      view.focus();
    }
  };

  return (
    <ClickAwayListener onClickAway={() => {
      hideSelectionTooltip(pluginKey)(view.state, view.dispatch, view);
    }}
    >
      <Grow
        in={true}
        easing={{
          enter: 'ease-in',
          exit: 'ease-out'
        }}
        timeout={150}
      >

        <Box flexDirection='column' gap={2} m={1} display='flex' width='400px'>
          <Box flexDirection='column' display='flex'>
            <FieldLabel>Title</FieldLabel>
            <TextField
              placeholder="What's the vote?"
              value={voteTitle}
              onChange={(e) => {
                setVoteTitle(e.target.value);
              }}
            />
          </Box>
          <Box flexGrow={1}>
            <InlineCharmEditor
              content={voteDescription}
              style={{
                fontSize: '14px',
                borderColor: theme.palette.secondary.main,
                borderWidth: '2px',
                borderStyle: 'solid'
              }}
              placeholderText='Details (Optional)'
              onContentChange={({ doc }) => {
                setVoteDescription(doc);
              }}
            />
          </Box>
          <Box flexDirection='column' display='flex'>
            <FieldLabel>Deadline</FieldLabel>
            <DateTimePicker
              minDate={DateTime.fromMillis(Date.now())}
              value={deadline}
              onAccept={async (value) => {
                if (value) {
                  setDeadline(value);
                }
              }}
              onChange={(value) => {
                if (value) {
                  setDeadline(value);
                }
              }}
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
          </Box>

          <Button
            size='small'
            onClick={handleSubmit}
            sx={{
              alignSelf: 'flex-start',
              marginBottom: '4px',
              marginRight: '8px'
            }}
            disabled={isEmpty}
          >
            Start
          </Button>
        </Box>
      </Grow>
    </ClickAwayListener>
  );
}
