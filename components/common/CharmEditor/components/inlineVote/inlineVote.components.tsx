import { PluginKey, TextSelection } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { hideSelectionTooltip } from '@bangle.dev/tooltip/selection-tooltip';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { ClickAwayListener, FormControlLabel, Grow, IconButton, List, ListItem, ListItemText, Radio, RadioGroup, TextField, Typography } from '@mui/material';
import { Box, useTheme } from '@mui/system';
import { DateTimePicker } from '@mui/x-date-pickers';
import Button from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { usePages } from 'hooks/usePages';
import { DateTime } from 'luxon';
import { PageContent } from 'models';
import { useState } from 'react';
import { v4 } from 'uuid';
import DeleteIcon from '@mui/icons-material/Delete';
import { AddCircle } from '@mui/icons-material';
import InlineCharmEditor from '../../InlineCharmEditor';
import { checkForEmpty } from '../../utils';
import { updateInlineVote } from './inlineVote.utils';

type VoteType = 'boolean' | 'options';

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
  const [voteType, setVoteType] = useState<VoteType>('boolean');
  const [options, setOptions] = useState(['', '', '']);

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
      <Box
        flexDirection='column'
        gap={1.5}
        m={1}
        display='flex'
        width='400px'
        sx={{
          height: 400,
          overflowY: 'scroll'
        }}
      >
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
              backgroundColor: 'var(--input-bg)'
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
        <RadioGroup
          row
          defaultValue='boolean'
          value={voteType}
          onChange={(e) => {
            setVoteType(e.target.value as VoteType);
          }}
        >
          <FormControlLabel
            value='boolean'
            control={<Radio />}
            label='Yes / No'
          />
          <FormControlLabel value='options' control={<Radio />} label='# Options' />
        </RadioGroup>
        {voteType === 'boolean' ? (
          <List>
            <ListItem sx={{ p: 0 }}>
              <CheckCircleIcon fontSize='small' sx={{ mr: 1 }} />
              <ListItemText>Yes</ListItemText>
            </ListItem>
            <ListItem sx={{ p: 0 }}>
              <CancelIcon fontSize='small' sx={{ mr: 1 }} />
              <ListItemText>No</ListItemText>
            </ListItem>
            <ListItem sx={{ p: 0 }}>
              <RemoveCircleIcon fontSize='small' sx={{ mr: 1 }} />
              <ListItemText>Abstain</ListItemText>
            </ListItem>
          </List>
        ) : (
          <List>
            {options.map((option, index) => (
              <ListItem sx={{ px: 0, display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => {
                    options[index] = e.target.value;
                    setOptions([...options]);
                  }}
                />
                <IconButton
                  disabled={options.length === 2}
                  size='small'
                  onClick={() => {
                    setOptions([...options.slice(0, index), ...options.slice(index + 1)]);
                  }}
                >
                  <DeleteIcon fontSize='small' />
                </IconButton>
              </ListItem>
            ))}
            <ListItem sx={{ px: 0, display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                value='No Change'
                disabled
              />
            </ListItem>
            <Box display='flex' gap={0.5} alignItems='center'>
              <IconButton
                size='small'
                onClick={() => {
                  setOptions([...options, '']);
                }}
              >
                <AddCircle fontSize='small' />
              </IconButton>
              <Typography variant='subtitle1'>
                Add Option
              </Typography>
            </Box>
          </List>
        ) }
        <Button
          size='small'
          onClick={handleSubmit}
          sx={{
            alignSelf: 'flex-start',
            marginBottom: '4px',
            marginRight: '8px'
          }}
          disabled={isEmpty || (voteType === 'options' && options.findIndex(option => option.length === 0) !== -1)}
        >
          Start
        </Button>
      </Box>
    </ClickAwayListener>
  );
}
