import { VoteType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import AddCircle from '@mui/icons-material/AddCircle';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {
  Box,
  FormControlLabel,
  FormLabel,
  IconButton,
  ListItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { NumericFieldWithButtons } from 'components/common/form/fields/NumericFieldWithButtons';
import type { ProposalEvaluationInput } from 'lib/proposal/createProposal';

type CreateVoteModalProps = {
  readOnly?: boolean;
  onChange?: (vote: ProposalEvaluationInput['voteSettings']) => void;
  value: ProposalEvaluationInput['voteSettings'];
};

const StyledVoteSettings = styled.div`
  & .MuiInputBase-input {
    box-sizing: content-box;
  }
`;

export function VoteSettings({ readOnly, value, onChange }: CreateVoteModalProps) {
  const [passThreshold, setPassThreshold] = useState<number>(value?.threshold || 50);
  const [voteType, setVoteType] = useState<VoteType>(value?.type ?? VoteType.Approval);
  const [options, setOptions] = useState<string[]>(value?.options ?? []);
  const [maxChoices, setMaxChoices] = useState(value?.maxChoices ?? 1);
  const [durationDays, setDurationDays] = useState(5);

  useEffect(() => {
    if (voteType === VoteType.SingleChoice) {
      setOptions(['Option 1', 'Option 2', 'Abstain']);
    } else if (voteType === VoteType.Approval) {
      setOptions(['Yes', 'No', 'Abstain']);
    }
  }, [voteType]);

  // useEffect on the values to call onChange() doesnt seem ideal, but it works for now
  useEffect(() => {
    if (onChange) {
      const hasError =
        passThreshold > 100 ||
        (voteType === VoteType.SingleChoice && options.some((option) => option.length === 0)) ||
        new Set(options).size !== options.length;
      // console.log({ hasError, passThreshold, voteType, options, maxChoices, durationDays });
      if (!hasError) {
        onChange({
          threshold: passThreshold,
          type: voteType,
          options,
          maxChoices: voteType === VoteType.Approval ? 1 : maxChoices,
          durationDays
        });
      }
    }
  }, [voteType, options, maxChoices, durationDays, passThreshold]);

  return (
    <StyledVoteSettings>
      <Stack direction='row' alignItems='center' gap={2} justifyContent='space-between' mb={1}>
        <FormLabel>
          <Typography component='span' variant='subtitle1'>
            Duration (days)
          </Typography>
        </FormLabel>
        <NumericFieldWithButtons
          disabled={readOnly}
          value={durationDays}
          onChange={setDurationDays}
          min={1}
          max={100}
        />
      </Stack>

      <FormLabel>
        <Typography component='span' variant='subtitle1'>
          Options
        </Typography>
      </FormLabel>
      <RadioGroup
        row
        defaultValue={voteType}
        value={voteType}
        onChange={(e) => {
          setVoteType(e.target.value as VoteType);
        }}
        sx={{ mb: 1 }}
      >
        <FormControlLabel
          disabled={readOnly}
          value={VoteType.Approval}
          control={<Radio />}
          label='Yes / No / Abstain'
        />
        <FormControlLabel
          disabled={readOnly}
          value={VoteType.SingleChoice}
          control={<Radio />}
          label='Custom Options'
          sx={{ mr: 0 }}
        />
      </RadioGroup>
      {voteType === VoteType.SingleChoice && (
        <Stack mb={2}>
          <InlineVoteOptions options={options} setOptions={setOptions} />
          <Stack direction='row' alignItems='center' gap={2} mt={2} justifyContent='space-between'>
            <FormLabel>
              <Typography component='span' variant='subtitle1'>
                Max choices
              </Typography>
            </FormLabel>
            <NumericFieldWithButtons disabled={readOnly} value={maxChoices} onChange={setMaxChoices} min={1} />
          </Stack>
        </Stack>
      )}

      {maxChoices === 1 && (
        <Stack direction='row' alignItems='center' gap={2} justifyContent='space-between'>
          <FormLabel>
            <Typography component='span' variant='subtitle1'>
              Pass Threshold (%)
            </Typography>
          </FormLabel>
          <NumericFieldWithButtons disabled={readOnly} value={passThreshold} onChange={setPassThreshold} max={100} />
        </Stack>
      )}
    </StyledVoteSettings>
  );
}

interface InlineVoteOptionsProps {
  options: string[];
  setOptions: Dispatch<SetStateAction<string[]>>;
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
              value={option}
              onChange={(e) => {
                options[index] = e.target.value;
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
            setOptions([...options, '']);
          }}
        >
          <AddCircle fontSize='small' sx={{ mr: 1 }} />
          <Typography variant='subtitle1'>Add Option</Typography>
        </Button>
      </Stack>
    </div>
  );
}
