import { Add, Remove } from '@mui/icons-material';
import { Stack, TextField } from '@mui/material';

import { Button } from 'components/common/Button';
import { getNumberFromString } from '@packages/lib/utils/numbers';

type Props = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  name?: string;
  min?: number;
  max?: number;
};

export function NumericFieldWithButtons({ value, disabled, onChange, name, min = 0, max }: Props) {
  const handleChange = (v: number) => {
    if (v < min) {
      onChange(min);
    } else if (typeof max === 'number' && v > max) {
      onChange(max);
    } else {
      onChange(v);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedValue = getNumberFromString(event.target.value || '0') || 0;
    handleChange(updatedValue);
  };

  const decrease = () => {
    handleChange((value || 0) - 1);
  };

  const increase = () => {
    handleChange((value || 0) + 1);
  };

  return (
    <Stack direction='row' gap={0.5} mr={1}>
      <Button
        sx={{ minWidth: '40px', px: 1 }}
        onClick={decrease}
        variant='outlined'
        color='textPrimary'
        disabled={disabled}
      >
        <Remove color='inherit' fontSize='small' />
      </Button>

      <TextField
        data-test='numeric-field'
        value={value}
        onChange={handleInputChange}
        name={name}
        sx={{ maxWidth: '70px' }}
        disabled={disabled}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            increase();
          } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            decrease();
          }
        }}
      />

      <Button
        sx={{ minWidth: '40px', px: 1 }}
        variant='outlined'
        color='textPrimary'
        onClick={increase}
        disabled={disabled}
      >
        <Add color='inherit' fontSize='small' />
      </Button>
    </Stack>
  );
}
