import type { VoteOptions } from '@charmverse/core/prisma-client';
import { Box, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import millify from 'millify';

import { percent } from '@packages/lib/utils/numbers';

type Props = {
  value: string | undefined | null;
  onChange: (value: string) => void;
  voteOptions: VoteOptions[];
  disabled?: boolean;
  totalVotes: number;
  aggregatedResult: Record<string, number>;
  showAggregateResult?: boolean;
};

export function SingleChoiceForm({
  showAggregateResult,
  value,
  onChange,
  voteOptions,
  disabled,
  totalVotes,
  aggregatedResult
}: Props) {
  return (
    <RadioGroup value={value} onChange={(e, v) => onChange(v)}>
      {voteOptions.map((voteOption) => (
        <FormControlLabel
          sx={{
            mr: 0
          }}
          data-test={`current-vote-${voteOption.name}`}
          key={voteOption.name}
          control={<Radio size='small' />}
          disabled={disabled}
          value={voteOption.name}
          label={
            <Box display='flex' justifyContent='space-between' flexGrow={1}>
              <span>
                {voteOption.name}
                {showAggregateResult && aggregatedResult?.[voteOption.name]
                  ? ` (${
                      aggregatedResult[voteOption.name] < 1
                        ? aggregatedResult[voteOption.name]
                        : millify(aggregatedResult[voteOption.name])
                    })`
                  : ''}
              </span>
              <Typography variant='subtitle1' color='secondary' component='span'>
                {percent({
                  value: aggregatedResult?.[voteOption.name] ?? 0,
                  total: totalVotes,
                  significantDigits: 2
                })}
              </Typography>
            </Box>
          }
          disableTypography
        />
      ))}
    </RadioGroup>
  );
}
