import type { VoteOptions } from '@charmverse/core/prisma-client';
import { Box, Checkbox, FormControlLabel, FormGroup, Stack, Typography } from '@mui/material';

import { percent } from 'lib/utilities/numbers';

type Props = {
  value: string[] | undefined | null;
  onChange: (value: string[]) => void;
  voteOptions: VoteOptions[];
  disabled?: boolean;
  totalVotes: number;
  aggregatedResult: Record<string, number>;
  maxChoices: number | null;
};

export function MultiChoiceForm({
  value,
  onChange,
  voteOptions,
  disabled,
  totalVotes,
  aggregatedResult,
  maxChoices
}: Props) {
  const isChecked = (v: string) => {
    if (Array.isArray(value)) {
      return value.includes(v);
    }

    return false;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const prevValue = value || [];
    const checked = event.target.checked;

    const newValue = checked
      ? [...new Set([...prevValue, event.target.name])]
      : prevValue.filter((v) => v !== event.target.name);

    onChange(newValue);
  };

  return (
    <Stack>
      <FormGroup>
        {voteOptions.map(({ name }) => (
          <FormControlLabel
            key={name}
            control={<Checkbox checked={isChecked(name)} onChange={handleChange} name={name} />}
            value={name}
            disabled={disabled || (!isChecked(name) && value?.length === maxChoices)}
            label={
              <Box display='flex' justifyContent='space-between' flexGrow={1}>
                <Stack direction='row' spacing={1}>
                  <Typography>{name}</Typography>
                </Stack>

                <Typography variant='subtitle1' color='secondary' component='span'>
                  {percent({
                    value: aggregatedResult?.[name] ?? 0,
                    total: totalVotes,
                    significantDigits: 2
                  })}
                </Typography>
              </Box>
            }
            sx={{ mr: 0 }}
            disableTypography
          />
        ))}
      </FormGroup>

      {typeof maxChoices === 'number' && (
        <Stack direction='row' alignItems='center' justifyContent='flex-end' flex={1} mb={0.5}>
          <Typography variant='subtitle1'>Choices left: {maxChoices - (value?.length || 0)}</Typography>
        </Stack>
      )}
    </Stack>
  );
}
