import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';

import FilterList from './components/FilterList';
import FilterSelect from './components/FilterSelect';
import ForumPosts from './components/ForumPosts';

export default function ForumPage() {
  const [search, setSearch] = useState('');

  return (
    <CenteredPageContent>
      <Typography variant='h1'>Forum</Typography>
      <TextField
        variant='outlined'
        placeholder='Search Posts, Comments and Members'
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ padding: '20px 0' }}
        InputProps={{
          endAdornment: (
            <InputAdornment position='end'>
              <SearchIcon color='secondary' fontSize='small' />
            </InputAdornment>
          )
        }}
      />
      <Grid container spacing={2}>
        <Grid item xs={12} lg={9}>
          <Box display={{ xs: 'block', lg: 'none' }}>
            <FilterSelect />
          </Box>
          <ForumPosts search={search} />
        </Grid>
        <Grid item xs={12} lg={3} display={{ xs: 'none', lg: 'initial' }}>
          <FilterList />
        </Grid>
      </Grid>
    </CenteredPageContent>
  );
}
