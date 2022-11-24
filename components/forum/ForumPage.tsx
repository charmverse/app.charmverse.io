import SearchIcon from '@mui/icons-material/Search';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';

import ForumFilters from './components/ForumFilters/ForumFilters';
import ForumPosts from './components/ForumPosts';
import SidebarForum from './components/SidebarForum';

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
          <ForumFilters />
          <ForumPosts search={search} />
        </Grid>
        <Grid item xs={12} md={3} display={{ xs: 'none', md: 'initial' }}>
          <SidebarForum disabled={false} />
        </Grid>
      </Grid>
    </CenteredPageContent>
  );
}
