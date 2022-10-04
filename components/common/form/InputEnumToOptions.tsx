import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import type { SelectProps } from '@mui/material/Select';
import Select from '@mui/material/Select';
import { useEffect, useState } from 'react';

export interface Props extends Omit<SelectProps, 'onChange'> {
  onChange?: (option: string) => void;
  defaultValue?: string;
  title?: string;
  keyAndLabel: Record<string | any, string | number>;
}

export default function InputEnumToOptions ({ onChange = () => {}, defaultValue, title, keyAndLabel, sx, ...props }: Props) {

  const options = Object.entries(keyAndLabel);

  const [value, setValue] = useState<string | null>('');

  useEffect(() => {
    if (defaultValue && !value) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  return (
    <FormControl fullWidth>
      {
        title && (<InputLabel>{title}</InputLabel>)
      }

      <Select
        sx={sx}
        value={value}
        onChange={(ev) => {
          setValue(ev.target.value as string);
          if (ev.target.value) {
            onChange(ev.target.value as string);
          }
        }}
        {...props}
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

export function SmallSelect ({ sx = {}, ...props }: Props) {
  return (
    <InputEnumToOptions
      {...props}
      sx={{
        ...sx,
        background: 'transparent',
        fontSize: '.8em',
        borderColor: 'transparent',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' }
      }}
    />
  );
}
