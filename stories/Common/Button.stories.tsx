import { Check } from '@mui/icons-material';
import { Box, Paper } from '@mui/material';

import { Button } from 'components/common/Button';

export default {
  title: 'common/Buttons',
  component: Button
};

export function Primary() {
  return (
    <Paper sx={{ p: 4 }}>
      <Box display='flex' gap={4}>
        <Box display='flex' flexDirection='column' gap={2}>
          <Button color='inherit' size='small' variant='contained'>
            Contained small
          </Button>
          <Button color='primary' size='large' variant='contained'>
            Contained large
          </Button>
          <Button color='secondary' variant='contained'>
            Contained
          </Button>
          <Button color='success' variant='contained'>
            Contained
          </Button>
          <Button color='error' variant='contained'>
            Contained
          </Button>
          <Button color='info' variant='contained'>
            Contained
          </Button>
          <Button color='warning' variant='contained'>
            Contained
          </Button>
        </Box>
        <Box display='flex' flexDirection='column' gap={2}>
          <Button color='inherit' size='small' variant='outlined'>
            Outlined small
          </Button>
          <Button color='primary' size='large' variant='outlined'>
            Outlined large
          </Button>
          <Button color='secondary' variant='outlined'>
            Outlined
          </Button>
          <Button color='success' variant='outlined'>
            Outlined
          </Button>
          <Button color='error' variant='outlined'>
            Outlined
          </Button>
          <Button color='info' variant='outlined'>
            Outlined
          </Button>
          <Button color='warning' variant='outlined'>
            Outlined
          </Button>
        </Box>

        <Box display='flex' flexDirection='column' gap={2}>
          <Button color='inherit' size='small' variant='text'>
            Text small
          </Button>
          <Button color='primary' size='large' variant='text'>
            Text large
          </Button>
          <Button color='secondary' variant='text'>
            Text
          </Button>
          <Button color='success' variant='text'>
            Text
          </Button>
          <Button color='error' variant='text'>
            Text
          </Button>
          <Button color='info' variant='text'>
            Text
          </Button>
          <Button color='warning' variant='text'>
            Text
          </Button>
        </Box>
        <Box display='flex' flexDirection='column' gap={2}>
          <Button loading variant='contained'>
            Contained
          </Button>
          <Button loading variant='outlined'>
            Outlined
          </Button>
          <Button loading variant='text'>
            Loading
          </Button>
          <Button loading loadingMessage='Custom message' />
        </Box>
        <Box display='flex' flexDirection='column' gap={2}>
          <Button disabled variant='contained'>
            Contained
          </Button>
          <Button disabled variant='outlined'>
            Outlined
          </Button>
          <Button disabled variant='text'>
            Loading
          </Button>
          <Button disabled disabledTooltip='disabled' variant='contained'>
            With Tooltip
          </Button>
        </Box>
        <Box display='flex' flexDirection='column' gap={2}>
          <Button startIcon={<Check />}>Start Icon</Button>
          <Button endIcon={<Check />}>End Icon</Button>
        </Box>
      </Box>
    </Paper>
  );
}
