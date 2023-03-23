import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import type { SelectProps } from '@mui/material/Select';
import Select from '@mui/material/Select';
import { useEffect, useState } from 'react';

export type Props<T extends string> = Omit<SelectProps, 'onChange'> & {
  onChange?: (option: T) => void;
  defaultValue?: T;
  title?: string;
  keyAndLabel: Record<string | any, string | number>;
};

export default function InputEnumToOptions<T extends string>({
  onChange = () => {},
  defaultValue,
  title,
  keyAndLabel,
  sx,
  ...props
}: Props<T>) {
  const options = Object.entries(keyAndLabel);

  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    if (defaultValue && !value) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  return (
    <FormControl fullWidth>
      {title && <InputLabel>{title}</InputLabel>}

      <Select
        sx={sx}
        value={value}
        onChange={(ev) => {
          setValue(ev.target.value as T);
          if (ev.target.value) {
            onChange(ev.target.value as T);
          }
        }}
        {...props}
      >
        {options.map((option) => {
          return (
            <MenuItem value={option[0]} key={option[0]}>
              {option[1]}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}

export function SmallSelect<T extends string>({ sx = {}, ...props }: Props<T>) {
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
