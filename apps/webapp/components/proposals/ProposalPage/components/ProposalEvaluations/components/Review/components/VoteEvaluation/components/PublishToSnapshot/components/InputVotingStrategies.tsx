import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useEffect, useState } from 'react';

import FieldLabel from 'components/common/form/FieldLabel';
import type { SnapshotVotingStrategy } from '@packages/lib/snapshot/interfaces';

export interface Props {
  onChange?: (option: SnapshotVotingStrategy[]) => void;
  strategies: SnapshotVotingStrategy[];
}

const MAX_CONCURRENT_STRATEGIES = 8;

export function InputVotingStrategies({ onChange = () => {}, strategies }: Props) {
  const [value, setValue] = useState<SnapshotVotingStrategy[]>([strategies[0]]);

  useEffect(() => {
    onChange(value);
  }, []);

  return (
    <Box>
      <FieldLabel>Voting strategies (max. {MAX_CONCURRENT_STRATEGIES})</FieldLabel>
      <FormControl fullWidth>
        <Select
          value={value}
          multiple
          onChange={(ev) => {
            if (ev.target.value) {
              setValue(ev.target.value as any);
              onChange(ev.target.value as any);
            }
          }}
          renderValue={(val) => {
            return (val as SnapshotVotingStrategy[])?.map((strat) => strat.name).join(', ');
          }}
        >
          {strategies.map((strat) => {
            return (
              <MenuItem
                disabled={value.length >= MAX_CONCURRENT_STRATEGIES && !value.find((selected) => selected === strat)}
                value={strat as any}
                key={strat.name}
              >
                {strat.name}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}
