import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { useState, useEffect } from 'react';
import { BOUNTY_LABELS } from 'models/Bounty';
import { BountyStatus } from '@prisma/client';
import BountyStatusBadge, { BountyStatusChip } from 'components/bounties/BountyStatusBadge';

/**
 * @renderSelected Show selected options in this component, in the top, and the menu. Default is true.
 */
interface Props {
  renderSelected?: boolean
  onChange: (value: any) => void
  defaultValues?: BountyStatus []
}

const bountyFilterOptions = Object.keys(BountyStatus) as BountyStatus[];

export default function InputBountyStatus ({ onChange, defaultValues = [], renderSelected = true }: Props) {

  const [selectedChoices, setSelectedChoices] = useState<BountyStatus[]>(defaultValues);

  useEffect(() => {
    if (defaultValues) {
      setSelectedChoices(defaultValues);
    }
  }, [defaultValues]);

  function isSelected (status: BountyStatus): boolean {
    return selectedChoices.findIndex(choice => choice === status) > -1;
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
          displayEmpty={true}
          renderValue={(selectedValues: any) => (

            (renderSelected === false || !selectedValues || selectedValues.length === 0) ? (
              'Select status'
            ) : (
              <Box display='flex'>
                {
                    (selectedValues as any[])?.map(val => {
                      return (
                        <MenuItem sx={{ p: 0, pr: 0.2 }} key={val} value={val}>
                          <BountyStatusChip status={val as BountyStatus} showStatusLogo={false} />
                        </MenuItem>
                      );
                    })
                  }
              </Box>
            )

          )}
        >
          {
              bountyFilterOptions.map((option) => {

                return (
                  // Component manages display
                  renderSelected
                  // External component manages display, so we hide selected options
                  || (!renderSelected && !isSelected(option)) ? (
                    <MenuItem key={option} value={option}>
                      <BountyStatusChip status={option} showStatusLogo={false} />
                    </MenuItem>
                    ) : null);
              })
            }
        </Select>
      </Grid>
    </Grid>
  );
}

