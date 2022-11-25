import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';

import ForumFilters from './components/ForumFilters';
import ForumPosts from './components/ForumPosts';

export default function ForumPage () {
  const [search, setSearch] = useState('');

  /*
   // track page_view for the forum main page
  useEffect(() => {
    charmClient.track.trackAction('page_view', { spaceId: currentSpace?.id, type: 'forum' });
  }, []);
  */

  return (
    <CenteredPageContent>
      <Typography variant='h1'>Forum</Typography>
      <TextField
        variant='outlined'
        placeholder='Search Posts, Comments and Members'
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ padding: '20px 0' }}
        InputProps={{ endAdornment: <InputAdornment position='end'><SearchIcon color='secondary' fontSize='small' /></InputAdornment> }}
      />
      <Grid container spacing={2}>
        <Grid item xs={12} md={9}>
          <Box display={{ xs: 'block', md: 'none' }}>
            <ForumFilters type='select' />
          </Box>
          <ForumPosts search={search} />
        </Grid>
        <Grid item xs={12} md={3} display={{ xs: 'none', md: 'initial' }}>
          <ForumFilters type='list' />
        </Grid>
      </Grid>
    </CenteredPageContent>
  );
}
