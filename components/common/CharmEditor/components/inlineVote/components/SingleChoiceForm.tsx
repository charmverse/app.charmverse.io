import type { VoteOptions } from '@charmverse/core/prisma-client';
import { Box, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';

import { percent } from 'lib/utils/numbers';

type Props = {
  value: string | undefined | null;
  onChange: (value: string) => void;
  voteOptions: VoteOptions[];
  disabled?: boolean;
  totalVotes: number;
  aggregatedResult: Record<string, number>;
};

export function SingleChoiceForm({ value, onChange, voteOptions, disabled, totalVotes, aggregatedResult }: Props) {
  return (
    <RadioGroup value={value} onChange={(e, v) => onChange(v)}>
      {voteOptions.map((voteOption) => (
        <FormControlLabel
          data-test={`current-vote-${voteOption.name}`}
          key={voteOption.name}
          control={<Radio size='small' />}
          disabled={disabled}
          value={voteOption.name}
          label={
            <Box display='flex' justifyContent='space-between' flexGrow={1}>
              <span>{voteOption.name}</span>
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
