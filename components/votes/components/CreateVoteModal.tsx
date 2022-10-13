import AddCircle from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { FormControlLabel, IconButton, ListItem, Radio, RadioGroup, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { VoteType } from '@prisma/client';
import { DateTime } from 'luxon';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

import Button from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import Modal from 'components/common/Modal';
import PublishToSnapshot from 'components/common/PageLayout/components/Header/components/Snapshot/PublishToSnapshot';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { useVotes } from 'hooks/useVotes';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import type { ExtendedVote } from 'lib/votes/interfaces';

interface InlineVoteOptionsProps {
  options: { name: string }[];
  setOptions: Dispatch<SetStateAction<{ name: string }[]>>;
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
          <ListItem
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            sx={{ px: 0, pt: 0, display: 'flex', gap: 0.5 }}
          >
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
                  disabled={(options.length <= 2)}
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

interface CreateVoteModalProps {
  onClose?: () => void;
  onCreateVote?: (vote: ExtendedVote) => void;
  onPublishToSnapshot?: () => void;
  open?: boolean;
  proposal?: ProposalWithUsers;
}

export default function CreateVoteModal ({
  open = true, onClose = () => null, onCreateVote = () => null, onPublishToSnapshot = () => null, proposal }: CreateVoteModalProps) {
  const [voteTitle, setVoteTitle] = useState('');
  const [voteDescription, setVoteDescription] = useState('');
  const [passThreshold, setPassThreshold] = useState<number>(50);
  const [voteType, setVoteType] = useState<VoteType>(VoteType.Approval);
  const [options, setOptions] = useState<{ name: string }[]>([]);
  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false);
  const { user } = useUser();
  const { createVote } = useVotes();

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
      type: voteType,
      context: proposal ? 'proposal' : 'inline'
    });

    if (onCreateVote) {
      onCreateVote(vote);
    }
  };

  const disabledSave = passThreshold > 100
    || (!proposal && voteTitle.length === 0)
    || (voteType === VoteType.SingleChoice && (options.findIndex(option => option.name.length === 0) !== -1))
    || (new Set(options.map(option => option.name)).size !== options.length);

  const isProposalAuthor = (proposal?.authors.find(author => author.userId === user?.id) ?? false);

  return (
    <Modal title={proposal ? 'Create a vote' : 'Create a poll'} size='large' open={open} onClose={onClose ?? (() => {})}>
      <Box
        flexDirection='column'
        gap={1.5}
        m={1}
        display='flex'
      >
        {!proposal && (
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
        )}

        {!proposal && (
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
        )}
        <Box display='flex' gap={1}>
          <Box flexDirection='column' display='flex' flexGrow={1}>
            <FieldLabel>Deadline</FieldLabel>
            {/* This as any statement is to save time. We are providing an official adapter from MUI Library as outlined here https://mui.com/x/react-date-pickers/date-picker/#basic-usage */}
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
            defaultValue={VoteType.Approval}
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
            <FormControlLabel value={VoteType.SingleChoice} control={<Radio />} label='Custom Options' />
          </RadioGroup>
        </Box>
        {voteType === VoteType.SingleChoice && <InlineVoteOptions options={options} setOptions={setOptions} />}
        <Stack gap={2} flexDirection='row' alignItems='center'>
          <Button
            onClick={handleSubmit}
            sx={{
              alignSelf: 'flex-start'
            }}
            disabled={disabledSave}
          >
            Create
          </Button>
          {proposal?.status === 'reviewed' && (
            <>
              or
              <Tooltip title={!isProposalAuthor ? 'Only proposal authors can publish to snapshot' : ''}>
                <div>
                  <PublishToSnapshot
                    renderContent={({ label, onClick, icon }) => (
                      <Button disabled={!isProposalAuthor} onClick={onClick}>
                        {icon}
                        <Typography>{label}</Typography>
                      </Button>
                    )}
                    onPublish={onPublishToSnapshot}
                    pageId={proposal.id}
                  />
                </div>
              </Tooltip>
            </>

          )}
        </Stack>
      </Box>
    </Modal>
  );
}
