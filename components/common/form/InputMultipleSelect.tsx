import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

export interface SelectableOption {
  label: string,
  value: any
}

interface Props {
  title?: string,
  onChange: (value: any) => void
  options: SelectableOption[],
  defaultValues?: any []
}

export default function InputMultipleSelect ({ options, title = 'Select choices', onChange, defaultValues = [] }: Props) {

  const [selectedChoices, setSelectedChoices] = useState<SelectableOption[]>(defaultValues);

  function isSelected (option: SelectableOption): boolean {
    return selectedChoices.findIndex(choice => choice === option.value) > -1;
  }

  function selectOption (ev: SelectChangeEvent) {

    ev.preventDefault();

    const selected = ev?.target?.value as any ?? [];

    setSelectedChoices(selected);

    onChange(selected);

  }

  return (
    <Grid container direction='row' alignItems='center'>
      <Grid item xs={12}>
        <Select
          multiple
          value={selectedChoices as any}
          onChange={selectOption}
          renderValue={(selectedValues: any) => (

            (!selectedValues || selectedValues.length === 0) ? (
              <Box>
                TITLE
              </Box>
            ) : (
              <Box display='flex'>
                {
                    (selectedValues as any[]).map(val => {

                      const option = options.find(opt => opt.value === val);

                      return option ? (
                        <MenuItem sx={{ p: 0, pr: 0.2 }} key={option.label} value={option.value}>
                          <Checkbox
                            checked
                            sx={{ pt: 0, pb: 0 }}
                          />
                          <ListItemText primary={option.label} />
                        </MenuItem>
                      ) : null;
                    })
                  }
              </Box>
            )

          )}
        >
          {
              options.map(option => {
                return (
                  <MenuItem key={option.label} value={option.value}>
                    <Checkbox checked={isSelected(option)} />
                    <ListItemText primary={option.label} />
                  </MenuItem>
                );
              })
            }
        </Select>
      </Grid>
    </Grid>
  );
}

