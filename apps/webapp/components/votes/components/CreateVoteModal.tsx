import { VoteType } from '@charmverse/core/prisma';
import AddCircle from '@mui/icons-material/AddCircle';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {
  Box,
  FormControlLabel,
  IconButton,
  ListItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { emptyDocument } from '@packages/charmeditor/constants';
import type { PageContent } from '@packages/charmeditor/interfaces';
import type { ExtendedVote } from '@packages/lib/votes/interfaces';
import { DateTime } from 'luxon';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import { Dialog } from 'components/common/Dialog/Dialog';
import FieldLabel from 'components/common/form/FieldLabel';
import { NumericFieldWithButtons } from 'components/common/form/fields/NumericFieldWithButtons';
import { useVotes } from 'hooks/useVotes';

interface CreateVoteModalProps {
  onClose?: () => void;
  onCreateVote?: (vote: ExtendedVote) => void;
  open?: boolean;
  pageId?: string;
  postId?: string;
}

export function CreateVoteModal({
  open = true,
  onClose = () => null,
  onCreateVote = () => null,
  pageId,
  postId
}: CreateVoteModalProps) {
  const [voteTitle, setVoteTitle] = useState('');
  const [passThreshold, setPassThreshold] = useState<number>(50);
  const [voteType, setVoteType] = useState<VoteType>(VoteType.Approval);
  const [options, setOptions] = useState<{ name: string }[]>([]);
  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false);
  const { createVote } = useVotes({ pageId, postId });
  const [voteContent, setVoteContent] = useState<{ content: PageContent; contentText: string }>({
    content: emptyDocument,
    contentText: ''
  });
  const [maxChoices, setMaxChoices] = useState(1);

  useEffect(() => {
    if (voteType === VoteType.SingleChoice) {
      setOptions([
        {
          name: 'Option 1'
        },
        {
          name: 'Option 2'
        },
        {
          name: 'Abstain'
        }
      ]);
    } else if (voteType === VoteType.Approval) {
      setOptions([
        {
          name: 'Yes'
        },
        {
          name: 'No'
        },
        {
          name: 'Abstain'
        }
      ]);
    }
  }, [voteType]);

  const [deadline, setDeadline] = useState(DateTime.fromMillis(Date.now()).plus({ hour: 12 }));
  const handleSubmit = async (e: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.preventDefault();

    const maxChoicesToSave = voteType === VoteType.Approval ? 1 : maxChoices;
    const voteTypeToSave = maxChoicesToSave > 1 ? VoteType.MultiChoice : voteType;

    const vote = await createVote({
      deadline: deadline.toJSDate(),
      voteOptions: options.map((option) => option.name),
      title: voteTitle,
      content: voteContent.content,
      contentText: voteContent.contentText,
      pageId,
      postId,
      threshold: +passThreshold,
      context: 'inline',
      type: voteTypeToSave,
      maxChoices: maxChoicesToSave,
      strategy: 'regular'
    });

    if (onCreateVote) {
      onCreateVote(vote);
    }
  };

  const disabledSave =
    passThreshold > 100 ||
    voteTitle.length === 0 ||
    (voteType === VoteType.SingleChoice && options.findIndex((option) => option.name.length === 0) !== -1) ||
    new Set(options.map((option) => option.name)).size !== options.length;

  return (
    <Dialog
      title='Create a poll'
      open={open}
      onClose={onClose ?? (() => {})}
      footerActions={
        <Stack gap={2} flexDirection='row' alignItems='center'>
          <Button
            data-test='create-vote-button'
            onClick={handleSubmit}
            sx={{
              alignSelf: 'flex-start'
            }}
            disabled={disabledSave}
          >
            Create
          </Button>
        </Stack>
      }
    >
      <Box flexDirection='column' gap={1.5} m={1} display='flex' flex={1}>
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
          <CharmEditor
            disablePageSpecificFeatures
            disableRowHandles
            style={{
              left: 0,
              minHeight: 75,
              backgroundColor: 'var(--input-bg)'
            }}
            disableMention
            colorMode='dark'
            placeholderText='Details (Optional)'
            content={voteContent.content as PageContent}
            enableVoting={false}
            disableNestedPages
            isContentControlled
            onContentChange={(content) => {
              setVoteContent({
                content: content.doc,
                contentText: content.rawText
              });
            }}
          />
        </Box>
        <Box display='flex' gap={1}>
          <Stack direction='row' alignItems='center' gap={2} justifyContent='space-between' flex={1}>
            <FieldLabel whiteSpace='nowrap'>End date:</FieldLabel>
            {/* This as any statement is to save time. We are providing an official adapter from MUI Library as outlined here https://mui.com/x/react-date-pickers/date-picker/#basic-usage */}
            <Stack>
              <DateTimePicker
                disablePast
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
                slotProps={{
                  textField: {
                    inputProps: {
                      readOnly: true
                    },
                    fullWidth: true,
                    onClick: () => {
                      setIsDateTimePickerOpen((_isDateTimePickerOpen) => !_isDateTimePickerOpen);
                    }
                  }
                }}
                onClose={() => setIsDateTimePickerOpen(false)}
                open={isDateTimePickerOpen}
              />
            </Stack>
          </Stack>
        </Box>
        <Box display='flex' gap={2} alignItems='center' justifyContent='space-between'>
          <Typography fontWeight='bold'>Options: </Typography>
          <RadioGroup
            row
            defaultValue={VoteType.Approval}
            value={voteType}
            onChange={(e) => {
              setVoteType(e.target.value as VoteType);
            }}
          >
            <FormControlLabel value={VoteType.Approval} control={<Radio />} label='Yes / No / Abstain' />
            <FormControlLabel value={VoteType.SingleChoice} control={<Radio />} label='Custom Options' sx={{ mr: 0 }} />
          </RadioGroup>
        </Box>
        {voteType === VoteType.SingleChoice && (
          <Stack>
            <InlineVoteOptions options={options} setOptions={setOptions} />
            <Stack direction='row' alignItems='center' gap={2} mt={2} justifyContent='space-between'>
              <FieldLabel>Max choices:</FieldLabel>
              <NumericFieldWithButtons value={maxChoices} onChange={setMaxChoices} min={1} />
            </Stack>
          </Stack>
        )}

        {maxChoices === 1 && (
          <Stack direction='row' alignItems='center' gap={2} justifyContent='space-between'>
            <FieldLabel>Pass Threshold (%):</FieldLabel>
            <NumericFieldWithButtons value={passThreshold} onChange={setPassThreshold} max={100} />
          </Stack>
        )}
      </Box>
    </Dialog>
  );
}

interface InlineVoteOptionsProps {
  options: { name: string }[];
  setOptions: Dispatch<SetStateAction<{ name: string }[]>>;
}

function InlineVoteOptions({ options, setOptions }: InlineVoteOptionsProps) {
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
                  disabled={options.length <= 2}
                  size='small'
                  onClick={() => {
                    setOptions([...options.slice(0, index), ...options.slice(index + 1)]);
                  }}
                >
                  <DeleteOutlinedIcon fontSize='small' />
                </IconButton>
              </div>
            </Tooltip>
          </ListItem>
        );
      })}
      <Stack flex={1}>
        <Button
          sx={{ mr: 4 }}
          variant='outlined'
          color='secondary'
          size='small'
          onClick={() => {
            setOptions([
              ...options,
              {
                name: ''
              }
            ]);
          }}
        >
          <AddCircle fontSize='small' sx={{ mr: 1 }} />
          <Typography variant='subtitle1'>Add Option</Typography>
        </Button>
      </Stack>
    </div>
  );
}
