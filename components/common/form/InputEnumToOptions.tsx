import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import { useEffect, useState } from 'react';

export interface Props {
  onChange?: (option: string | null) => void
  defaultValue?: string,
  title?: string
  keyAndLabel: Record<string | any, string | number>
}

export default function InputEnumToOptions ({ onChange = () => {}, defaultValue, title, keyAndLabel }: Props) {

  const options = Object.entries(keyAndLabel);

  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    if (defaultValue && !value) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  return (
    <FormControl fullWidth>
      {
        title && (<InputLabel id='demo-simple-select-label'>{title}</InputLabel>)
      }

      <Select
        labelId='selection'
        id='selection'
        value={defaultValue}
        onChange={(ev) => {
          setValue(ev.target.value as string);
          onChange(ev.target.value as string);
        }}
      >
        {
          options.map(option => {
            return <MenuItem value={option[0]} key={option[0]}>{option[1]}</MenuItem>;
          })
        }
      </Select>
    </FormControl>
  );
}
