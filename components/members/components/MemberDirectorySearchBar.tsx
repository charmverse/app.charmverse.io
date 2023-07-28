import SearchIcon from '@mui/icons-material/Search';
import type { Theme } from '@mui/material';
import { useMediaQuery, InputAdornment, TextField } from '@mui/material';

export function MemberDirectorySearchBar({ onChange }: { onChange: (query: string) => void }) {
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  return (
    <TextField
      placeholder={isSmallScreen ? 'Search for members' : 'Search for members, roles, skills, interests, etc'}
      fullWidth
      sx={{
        my: 2
      }}
      onChange={(e) => {
        const search = e.target.value;
        onChange(search);
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position='end'>
            <SearchIcon color='secondary' />
          </InputAdornment>
        )
      }}
    />
  );
}
