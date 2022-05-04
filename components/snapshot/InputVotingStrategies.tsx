import FormControl from '@mui/material/FormControl';
import FieldLabel from 'components/common/form/FieldLabel';
import Select from '@mui/material/Select';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import { useEffect, useState } from 'react';
import { SnapshotVotingStrategy } from 'lib/snapshot';

export interface Props {
  onChange?: (option: SnapshotVotingStrategy[]) => void
  strategies: SnapshotVotingStrategy[]
}

export default function InputVotingStrategies ({ onChange = () => {}, strategies }: Props) {

  const [value, setValue] = useState<SnapshotVotingStrategy[]>([strategies[0]]);

  useEffect(() => {
    onChange(value);
  }, []);

  return (
    <Box>
      <FieldLabel>Voting strategies (max. 8)</FieldLabel>
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
          renderValue={val => {
            return (val as SnapshotVotingStrategy[])?.map(strat => strat.name).join(', ');
          }}
        >
          {
          strategies.map(strat => {
            return <MenuItem value={strat as any} key={strat.name}>{strat.name}</MenuItem>;
          })
        }
        </Select>
      </FormControl>
    </Box>
  );
}
