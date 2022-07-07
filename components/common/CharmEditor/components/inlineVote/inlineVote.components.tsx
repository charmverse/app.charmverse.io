import { Mark, MarkType, PluginKey, TextSelection } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { hideSelectionTooltip } from '@bangle.dev/tooltip/selection-tooltip';
import AddCircle from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { FormControlLabel, IconButton, ListItem, Radio, RadioGroup, TextField, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { DateTimePicker } from '@mui/x-date-pickers';
import Button from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { Modal } from 'components/common/Modal';
import { useInlineVotes } from 'hooks/useInlineVotes';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { usePages } from 'hooks/usePages';
import { DateTime } from 'luxon';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { findChildrenByMark, NodeWithPos } from 'prosemirror-utils';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { VoteType } from '@prisma/client';
import { hideSuggestionsTooltip } from '../@bangle.dev/tooltip/suggest-tooltip';
import PageInlineVote from '../PageInlineVote';
import { markName } from './inlineVote.constants';
import { InlineVotePluginState } from './inlineVote.plugins';
import { updateInlineVote } from './inlineVote.utils';

interface InlineVoteOptionsProps {
  options: { name: string }[]
  setOptions: Dispatch<SetStateAction<{ name: string }[]>>
}

export function InlineVoteList ({ pluginKey }: {pluginKey: PluginKey<InlineVotePluginState>}) {
  const view = useEditorViewContext();
  const {
    ids,
    show
  } = usePluginState(pluginKey) as InlineVotePluginState;

  const cardId = (new URLSearchParams(window.location.href)).get('cardId');
  const { currentPageActionDisplay } = usePageActionDisplay();
  const inlineVoteDetailModal = usePopupState({ variant: 'popover', popupId: 'inline-votes-detail' });
  const { inlineVotes, isValidating } = useInlineVotes();
  const inProgressVoteIds = ids.filter(voteId => inlineVotes[voteId]?.status === 'InProgress');

  // Using a ref so that its done only once
  const hasRemovedCompletedVoteMarks = useRef(false);

  useEffect(() => {
    if (!hasRemovedCompletedVoteMarks.current) {
      const inlineVotesList = Object.keys(inlineVotes);
      const inProgressVoteIdsSet = new Set(inlineVotesList.filter(voteId => inlineVotes[voteId].status === 'InProgress'));
      const completedVoteNodeWithMarks: (NodeWithPos & {mark: Mark})[] = [];
      if (!isValidating && inlineVotesList.length !== 0) {
        const inlineVoteMarkSchema = view.state.schema.marks[markName] as MarkType;
        const inlineVoteNodes = findChildrenByMark(view.state.doc, inlineVoteMarkSchema);
        for (const inlineVoteNode of inlineVoteNodes) {
          // Find the inline vote mark for the node
          const inlineVoteMark = inlineVoteNode.node.marks.find(mark => mark.type.name === inlineVoteMarkSchema.name);
          // If the mark point to a vote that is not in progress, remove it from document
          if (inlineVoteMark && !inProgressVoteIdsSet.has(inlineVoteMark.attrs.id)) {
            completedVoteNodeWithMarks.push({
              ...inlineVoteNode,
              mark: inlineVoteMark
            });
          }
        }
        if (completedVoteNodeWithMarks.length !== 0) {
          let tr = view.state.tr;
          // Automatically remove marks for votes that are not in progress anymore
          completedVoteNodeWithMarks.forEach(inlineVoteNodeWithMark => {
            const from = inlineVoteNodeWithMark.pos;
            const to = from + inlineVoteNodeWithMark.node.nodeSize;
            tr = tr.removeMark(from, to, inlineVoteMarkSchema);
          });
          if (view.dispatch) {
            view.dispatch(tr);
          }
        }
        hasRemovedCompletedVoteMarks.current = true;
      }
    }
  }, [inlineVotes, isValidating, view, hasRemovedCompletedVoteMarks]);

  if ((currentPageActionDisplay !== 'votes' || cardId) && show && inProgressVoteIds.length !== 0) {
    return (
      <Modal
        title='Votes details'
        size='large'
        open={true}
        onClose={() => {
          hideSuggestionsTooltip(pluginKey)(view.state, view.dispatch, view);
          inlineVoteDetailModal.close();
        }}
      >
        {inProgressVoteIds.map(inProgressVoteId => (
          <Box mb={2}>
            <PageInlineVote inlineVote={inlineVotes[inProgressVoteId]} detailed />
          </Box>
        ))}
      </Modal>
    );
  }
  return null;
}

function InlineVoteOptions (
  {
    options,
    setOptions
  }:
  InlineVoteOptionsProps
) {
  return (
    <div>
      {options.map((option, index) => {
        return (
          <ListItem sx={{ px: 0, pt: 0, display: 'flex', gap: 0.5 }}>
            <TextField
              // Disable changing text for No change option
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
            <Tooltip arrow placement='top' title={index < 2 ? 'At least two options are required' : ''}>
              <div>
                <IconButton
                  disabled={(index <= 1)}
                  size='small'
                  onClick={() => {
                    setOptions([...options.slice(0, index), ...options.slice(index + 1)]);
                  }}
                >
                  <DeleteIcon fontSize='small' />
                </IconButton>
              </div>
            </Tooltip>
          </ListItem>
        );
      })}
      <Button
        variant='outlined'
        color='secondary'
        size='small'
        onClick={() => {
          setOptions([...options, {
            name: ''
          }]);
        }}
      >
        <AddCircle fontSize='small' sx={{ mr: 1 }} />
        <Typography variant='subtitle1'>
          Add Option
        </Typography>
      </Button>
    </div>
  );
}

export function InlineVoteSubMenu ({ pluginKey }: { pluginKey: PluginKey }) {
  const view = useEditorViewContext();
  const [voteTitle, setVoteTitle] = useState('');
  const [voteDescription, setVoteDescription] = useState('');
  const [passThreshold, setPassThreshold] = useState<number>(50);
  const [voteType, setVoteType] = useState<VoteType>(VoteType.Approval);
  const [options, setOptions] = useState<{ name: string }[]>([]);
  const { createVote } = useInlineVotes();
  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false);

  useEffect(() => {
    if (voteType === VoteType.SingleChoice) {
      setOptions([{
        name: 'Option 1'
      }, {
        name: 'Option 2'
      }, {
        name: 'Abstain'
      }]);
    }
    else if (voteType === VoteType.Approval) {
      setOptions([{
        name: 'Yes'
      }, {
        name: 'No'
      }, {
        name: 'Abstain'
      }]);
    }
  }, [voteType]);

  const [deadline, setDeadline] = useState(DateTime.fromMillis(Date.now()).plus({ hour: 12 }));
  const { currentPageId } = usePages();
  const handleSubmit = async (e: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement, MouseEvent>) => {
    const cardId = typeof window !== 'undefined' ? (new URLSearchParams(window.location.href)).get('cardId') : null;
    e.preventDefault();

    const vote = await createVote({
      deadline: deadline.toJSDate(),
      voteOptions: options.map(option => option.name),
      title: voteTitle,
      description: voteDescription,
      pageId: cardId ?? currentPageId,
      threshold: +passThreshold,
      type: voteType
    });

    updateInlineVote(vote.id)(view.state, view.dispatch);
    hideSelectionTooltip(pluginKey)(view.state, view.dispatch, view);
    const tr = view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$to.pos)));
    view.dispatch(tr);
    view.focus();
  };

  return (
    <Modal title='Create an inline vote' size='large' open onClose={() => hideSelectionTooltip(pluginKey)(view.state, view.dispatch, view)}>
      <Box
        flexDirection='column'
        gap={1.5}
        m={1}
        display='flex'
      >
        <Box flexDirection='column' display='flex'>
          <FieldLabel>Title</FieldLabel>
          <TextField
            autoFocus
            placeholder="What's the vote?"
            value={voteTitle}
            onChange={(e) => {
              setVoteTitle(e.target.value);
            }}
          />
        </Box>

        <Box flexDirection='column' display='flex'>
          <TextField
            placeholder='Details (Optional)'
            multiline
            rows={3}
            value={voteDescription}
            onChange={(e) => {
              setVoteDescription(e.target.value);
            }}
          />
        </Box>
        <Box display='flex' gap={1}>
          <Box flexDirection='column' display='flex' flexGrow={1}>
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
                  fullWidth
                  onClick={() => {
                    setIsDateTimePickerOpen((_isDateTimePickerOpen) => !_isDateTimePickerOpen);
                  }}
                />
              )}
              onClose={() => setIsDateTimePickerOpen(false)}
              open={isDateTimePickerOpen}
            />
          </Box>
          <Box flexDirection='column' display='flex' flexGrow={1}>
            <FieldLabel>Pass Threshold (%)</FieldLabel>
            <TextField
              fullWidth
              type='number'
              value={passThreshold}
              onChange={(e) => {
                setPassThreshold(Number(e.target.value as any));
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
        </Box>
        <Box display='flex' gap={2} alignItems='center'>
          <Typography fontWeight='bold'>Options: </Typography>
          <RadioGroup
            row
            defaultValue='default'
            value={voteType}
            onChange={(e) => {
              setVoteType(e.target.value as VoteType);
            }}
          >
            <FormControlLabel
              value={VoteType.Approval}
              control={<Radio />}
              label='Yes / No / Abstain'
            />
            <FormControlLabel value={VoteType.SingleChoice} control={<Radio />} label='# Custom' />
          </RadioGroup>
        </Box>
        {voteType !== VoteType.Approval && <InlineVoteOptions options={options} setOptions={setOptions} />}
        <Button
          onClick={handleSubmit}
          sx={{
            alignSelf: 'flex-start',
            marginBottom: '4px',
            marginRight: '8px'
          }}
          disabled={passThreshold > 100
            || voteTitle.length === 0
            || (voteType === VoteType.SingleChoice && (options.findIndex(option => option.name.length === 0) !== -1))
            || (new Set(options.map(option => option.name)).size !== options.length)}
        >
          Create
        </Button>
      </Box>
    </Modal>
  );
}
