import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import type { SelectProps } from '@mui/material/Select';
import Select from '@mui/material/Select';
import { useMemo } from 'react';
import type { ReactNode } from 'react';

export type Props<T extends string> = Omit<SelectProps, 'onChange' | 'renderValue'> & {
  onChange?: (option: T) => void;
  renderValue?: (option: T) => ReactNode;
  defaultValue?: T;
  title?: string;
  keyAndLabel: Partial<Record<Exclude<T, ''>, string | JSX.Element>>;
};

export default function InputEnumToOptions<T extends string>({
  onChange = () => {},
  defaultValue,
  title,
  keyAndLabel,
  sx,
  ...props
}: Props<T>) {
  const options = useMemo(() => Object.entries(keyAndLabel) as [T, string][], [keyAndLabel]);

  return (
    <FormControl fullWidth>
      {title && <InputLabel>{title}</InputLabel>}

      <Select
        sx={sx}
        value={defaultValue as any}
        onChange={(ev) => {
          onChange(ev.target.value as T);
        }}
        onOpen={(ev) => {
          ev.stopPropagation();
        }}
        {...props}
      >
        {options.map((option) => {
          if (option[0] === '') {
            return null;
          }
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
