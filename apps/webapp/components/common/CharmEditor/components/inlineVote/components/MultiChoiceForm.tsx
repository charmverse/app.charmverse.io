import type { VoteOptions } from '@charmverse/core/prisma-client';
import { Box, Checkbox, Chip, FormControlLabel, FormGroup, Stack, Typography } from '@mui/material';
import millify from 'millify';
import { useMemo } from 'react';

import { percent } from '@packages/lib/utils/numbers';

type Props = {
  value: string[] | undefined | null;
  onChange: (value: string[]) => void;
  voteOptions: VoteOptions[];
  disabled?: boolean;
  totalVotes: number;
  aggregatedResult: Record<string, number>;
  maxChoices: number | null;
  hasPassedDeadline: boolean;
  showAggregateResult?: boolean;
};

export function MultiChoiceForm({
  value,
  onChange,
  voteOptions,
  disabled,
  totalVotes,
  aggregatedResult,
  maxChoices,
  hasPassedDeadline,
  showAggregateResult
}: Props) {
  const sortedVoteOptions = useMemo(() => {
    if (!hasPassedDeadline) return voteOptions;

    const sortedOptions = [...voteOptions];
    sortedOptions.sort((a, b) => (aggregatedResult[b.name] ?? 0) - (aggregatedResult[a.name] ?? 0));

    return sortedOptions;
  }, []);

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

  const hasOptionPassed = (index: number) => {
    return hasPassedDeadline && maxChoices && index < maxChoices;
  };

  return (
    <Stack>
      <FormGroup>
        {sortedVoteOptions.map(({ name }, index) => (
          <FormControlLabel
            key={name}
            control={<Checkbox checked={isChecked(name)} onChange={handleChange} name={name} />}
            value={name}
            disabled={disabled || (!isChecked(name) && value?.length === maxChoices)}
            label={
              <Box display='flex' justifyContent='space-between' flexGrow={1}>
                <Stack direction='row' spacing={1} justifyContent='space-between' mr={1} flex={1}>
                  <Typography fontWeight={hasOptionPassed(index) ? 'bold' : 'normal'}>
                    {name}
                    {showAggregateResult && aggregatedResult?.[name]
                      ? ` (${aggregatedResult[name] < 1 ? aggregatedResult[name] : millify(aggregatedResult[name])})`
                      : ''}
                  </Typography>
                  {hasOptionPassed(index) && <Chip color='primary' size='small' label='Passed' />}
                </Stack>

                <Typography
                  variant='subtitle1'
                  color='secondary'
                  component='span'
                  sx={{ minWidth: '65px', textAlign: 'right' }}
                >
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
          {hasPassedDeadline ? (
            <Typography variant='subtitle1'>Max choices: {maxChoices}</Typography>
          ) : (
            <Typography variant='subtitle1'>Choices left: {maxChoices - (value?.length || 0)}</Typography>
          )}
        </Stack>
      )}
    </Stack>
  );
}
