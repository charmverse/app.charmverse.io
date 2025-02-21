import AddBoxIcon from '@mui/icons-material/AddBox';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { IconButton } from '@mui/material';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { isTruthy } from '@packages/lib/utils/types';
import { useState } from 'react';

import FieldLabel from 'components/common/form/FieldLabel';

interface Props {
  onChange: (choices: string[]) => void;
  title?: string;
  minimumOptions?: number;
  defaultOptions?: string[];
}

/**
 * Generates a list of text fields
 * @param onChange
 */
export default function InputGeneratorText({ onChange, title = 'Options', minimumOptions = 1, defaultOptions }: Props) {
  const [options, setOptions] = useState<Record<number | string, string>>(
    defaultOptions
      ? defaultOptions.reduce(
          (optionSet, opt, index) => {
            optionSet[index] = opt;
            return optionSet;
          },
          {} as Record<number, string>
        )
      : { 0: '' }
  );

  const keys = Object.keys(options);

  const lastKey = keys[keys.length - 1];

  const hasEnoughOptions =
    keys.reduce((validCount, optionKey) => {
      if (isTruthy(options[optionKey])) {
        validCount += 1;
      }
      return validCount;
    }, 0) >= minimumOptions;

  function updateValue(key: string, value: string) {
    const newOptions = {
      ...options,
      [key]: value
    };
    setOptions(newOptions);
    emitValues(newOptions);
  }

  function addRow() {
    const newIndex = parseInt(lastKey) + 1;

    setOptions({
      ...options,
      [newIndex]: ''
    });
  }

  function removeRow(key: string) {
    const newOptions = { ...options };
    delete newOptions[key];
    setOptions(newOptions);
    emitValues(newOptions);
  }

  // Emit only non empty
  function emitValues(values: Record<string, string>) {
    const toEmit = Object.values(values).filter((opt) => isTruthy(opt));
    onChange(toEmit);
  }

  return (
    <Grid container direction='column' xs spacing={1}>
      <Grid item>
        <FieldLabel>{title}</FieldLabel>
      </Grid>

      {keys.map((key) => {
        return (
          <Grid key={key} item display='flex' alignItems='center' gap={1}>
            <TextField
              defaultValue={options[key]}
              fullWidth
              onBlur={(ev) => {
                const newValue = ev.target.value;
                updateValue(key, newValue);
              }}
            />
            {keys.length > 1 && (
              <IconButton size='small' onClick={() => removeRow(key)}>
                <DeleteOutlinedIcon />
              </IconButton>
            )}
          </Grid>
        );
      })}

      <Grid item>
        <Typography display='flex' alignItems='center' gap={0.5}>
          Add row{' '}
          <IconButton size='small' onClick={addRow}>
            <AddBoxIcon fontSize='small' />
          </IconButton>
        </Typography>
      </Grid>

      {!hasEnoughOptions && (
        <Grid item>
          <Alert severity='info'>
            Please at least {minimumOptions} non empty option{minimumOptions !== 1 ? 's' : ''}
          </Alert>
        </Grid>
      )}
    </Grid>
  );
}
