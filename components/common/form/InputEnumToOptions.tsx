import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import type { SelectProps } from '@mui/material/Select';
import Select from '@mui/material/Select';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

export type Props<T extends string> = Omit<SelectProps, 'onChange' | 'renderValue'> & {
  onChange?: (option: T) => void;
  renderValue?: (option: T) => ReactNode;
  defaultValue?: T;
  title?: string;
  keyAndLabel: Partial<Record<Exclude<T, ''>, string>>;
};

export default function InputEnumToOptions<T extends string>({
  onChange = () => {},
  defaultValue,
  title,
  keyAndLabel,
  sx,
  ...props
}: Props<T>) {
  const options = Object.entries(keyAndLabel) as [T, string][];

  return (
    <FormControl fullWidth>
      {title && <InputLabel>{title}</InputLabel>}

      <Select
        sx={sx}
        value={defaultValue as any}
        onChange={(ev) => {
          onChange(ev.target.value as T);
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
        borderColor: 'transparent !important',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent !important' }
      }}
    />
  );
}
