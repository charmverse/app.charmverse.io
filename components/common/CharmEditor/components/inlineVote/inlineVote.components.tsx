import { PluginKey, TextSelection } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { hideSelectionTooltip } from '@bangle.dev/tooltip/selection-tooltip';
import AddCircle from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { ClickAwayListener, FormControlLabel, IconButton, ListItem, Radio, RadioGroup, TextField, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { DateTimePicker } from '@mui/x-date-pickers';
import Button from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { useInlineVotes } from 'hooks/useInlineVotes';
import { usePages } from 'hooks/usePages';
import { DateTime } from 'luxon';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { updateInlineVote } from './inlineVote.utils';

type VoteType = 'default' | 'custom';

interface InlineVoteOptionsProps {
  disableTextFields?: boolean
  options: { name: string }[]
  setOptions: Dispatch<SetStateAction<{ name: string }[]>>
  disableDelete?: boolean
  disableAddOption?: boolean
}

function InlineVoteOptions (
  {
    disableAddOption = false,
    disableDelete = false,
    options,
    setOptions,
    disableTextFields = false
  }:
  InlineVoteOptionsProps
) {
  const optionNames = options.map(option => option.name);
  return (
    <div>
      <FieldLabel>Options</FieldLabel>
      {options.map((option, index) => (
        <ListItem sx={{ px: 0, pt: 0, display: 'flex', gap: 0.5 }}>
          <TextField
            error={option.name.length === 0 || ([...optionNames.slice(0, index), optionNames.slice(index + 1)].includes(option.name))}
            // Disable changing text for No change option
            disabled={disableTextFields || index === 2}
            fullWidth
            placeholder={`Option ${index + 1}`}
            value={option.name}
            onChange={(e) => {
              options[index] = {
                name: e.target.value
              };
              setOptions([...options]);
            }}
          />
          <IconButton
            disabled={disableDelete || options.length === 2 || (index <= 2)}
            size='small'
            onClick={() => {
              setOptions([...options.slice(0, index), ...options.slice(index + 1)]);
            }}
          >
            <DeleteIcon fontSize='small' />
          </IconButton>
        </ListItem>
      ))}
      {!disableAddOption && (
      <Box display='flex' gap={0.5} alignItems='center'>
        <IconButton
          size='small'
          onClick={() => {
            setOptions([...options, {
              name: ''
            }]);
          }}
        >
          <AddCircle fontSize='small' />
        </IconButton>
        <Typography variant='subtitle1'>
          Add Option
        </Typography>
      </Box>
      )}
    </div>
  );
}

export function InlineVoteSubMenu ({ pluginKey }: { pluginKey: PluginKey }) {
  const view = useEditorViewContext();
  const [voteTitle, setVoteTitle] = useState('');
  const [voteDescription, setVoteDescription] = useState('');
  const [passThreshold, setPassThreshold] = useState<number>(50);
  const [voteType, setVoteType] = useState<VoteType>('default');
  const [options, setOptions] = useState<{ name: string }[]>([]);
  const { createVote } = useInlineVotes();

  useEffect(() => {
    if (voteType === 'custom') {
      setOptions([{
        name: 'Option 1'
      }, {
        name: 'Option 2'
      }, {
        name: 'No change'
      }]);
    }
    else if (voteType === 'default') {
      setOptions([{
        name: 'Yes'
      }, {
        name: 'No'
      }, {
        name: 'Abstain'
      }]);
    }
  }, [voteType]);

  const [deadline, setDeadline] = useState(DateTime.fromMillis(Date.now()));
  const { currentPageId } = usePages();
  const handleSubmit = async (e: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement, MouseEvent>) => {
    const cardId = typeof window !== 'undefined' ? (new URLSearchParams(window.location.href)).get('cardId') : null;
    e.preventDefault();
    const vote = await createVote({
      deadline: deadline.toJSDate(),
      options,
      title: voteTitle,
      description: voteDescription,
      pageId: cardId ?? currentPageId
    });

    updateInlineVote(vote.id)(view.state, view.dispatch);
    hideSelectionTooltip(pluginKey)(view.state, view.dispatch, view);
    const tr = view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$to.pos)));
    view.dispatch(tr);
    view.focus();
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
            error={voteTitle.length === 0}
            placeholder="What's the vote?"
            value={voteTitle}
            onChange={(e) => {
              setVoteTitle(e.target.value);
            }}
          />
        </Box>

        <Box flexDirection='column' display='flex'>
          <FieldLabel>Description</FieldLabel>
          <TextField
            placeholder='Details (Optional)'
            value={voteDescription}
            onChange={(e) => {
              setVoteDescription(e.target.value);
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
        <Box flexDirection='column' display='flex'>
          <FieldLabel>Pass Threshold</FieldLabel>
          <TextField
            type='number'
            value={passThreshold}
            onChange={(e) => {
              setPassThreshold(e.target.value as any);
            }}
            InputProps={{
              inputProps: {
                min: 1,
                max: 100,
                step: 1
              }
            }}
          />
        </Box>
        <RadioGroup
          row
          defaultValue='default'
          value={voteType}
          onChange={(e) => {
            setVoteType(e.target.value as VoteType);
          }}
        >
          <FormControlLabel
            value='default'
            control={<Radio />}
            label='Yes / No'
          />
          <FormControlLabel value='custom' control={<Radio />} label='# Options' />
        </RadioGroup>
        <InlineVoteOptions disableAddOption={voteType === 'default'} disableDelete={voteType === 'default'} disableTextFields={voteType === 'default'} options={options} setOptions={setOptions} />
        <Button
          size='small'
          onClick={handleSubmit}
          sx={{
            alignSelf: 'flex-start',
            marginBottom: '4px',
            marginRight: '8px'
          }}
          disabled={voteTitle.length === 0 || (voteType === 'custom' && (options.findIndex(option => option.name.length === 0) !== -1)) || (new Set(options.map(option => option.name)).size !== options.length)}
        >
          Create
        </Button>
      </Box>
    </ClickAwayListener>
  );
}
