import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';

export default function InputSelect () {
  return (
    <Grid item>
      <Grid container direction='row' alignItems='center'>
        <Grid item xs={6}>
          <Typography>Status</Typography>
        </Grid>
        <Grid item xs={6}>
          <Select
            labelId='select-type'
            id='select-type'
            variant='standard'
            label='type'
          >
            <MenuItem value='pending'>
              <Chip label='Not Started' color='primary' />
            </MenuItem>
            <MenuItem value='in-progress'>
              <Chip label='In Progress' color='secondary' />
            </MenuItem>
            <MenuItem value='done'>
              <Chip label='Done' color='secondary' />
            </MenuItem>
          </Select>
        </Grid>
      </Grid>
    </Grid>

  );
}

