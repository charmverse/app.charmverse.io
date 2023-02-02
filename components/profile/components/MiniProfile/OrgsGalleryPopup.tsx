import { useTheme } from '@emotion/react';
import SearchIcon from '@mui/icons-material/Search';
import {
  Dialog,
  DialogContent,
  List,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import { useMemo, useState } from 'react';

import Avatar from 'components/common/Avatar';
import { DialogTitle } from 'components/common/Modal';
import type { UserCommunity } from 'lib/profile';

export function OrgsGalleryPopup({
  onClose,
  onSelect,
  orgs
}: {
  onClose: VoidFunction;
  orgs: UserCommunity[];
  onSelect: (org: UserCommunity) => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [searchedTerm, setSearchedTerm] = useState('');

  const filteredOrgs = useMemo(() => {
    return searchedTerm.length === 0
      ? orgs
      : orgs.filter((org) => org.name.toLowerCase().includes(searchedTerm.toLowerCase()));
  }, [orgs, searchedTerm]);

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} fullWidth>
      <DialogTitle sx={{ '&&': { px: 2, py: 2 } }} onClose={onClose}>
        Your organizations gallery
      </DialogTitle>
      <DialogContent dividers>
        {orgs.length !== 0 && (
          <TextField
            fullWidth
            sx={{
              mb: 2
            }}
            onChange={(e) => setSearchedTerm(e.target.value)}
            value={searchedTerm}
            placeholder='Search for Organizations'
            InputProps={{
              startAdornment: <SearchIcon color='secondary' sx={{ mr: 1 }} fontSize='small' />
            }}
          />
        )}
        <List>
          {filteredOrgs.map((org) => {
            return (
              <MenuItem sx={{ p: 1 }} key={org.id} onClick={() => onSelect(org)}>
                <Avatar
                  sx={{ mr: 2 }}
                  className='hidden-on-visible'
                  avatar={org.logo}
                  name={org.name}
                  variant='rounded'
                  size='medium'
                />
                <ListItemText>
                  <Typography
                    sx={{
                      fontSize: {
                        sm: '1.15rem',
                        xs: '1.05rem'
                      }
                    }}
                    fontWeight={500}
                  >
                    {org.name}
                  </Typography>
                </ListItemText>
              </MenuItem>
            );
          })}
        </List>
      </DialogContent>
    </Dialog>
  );
}
