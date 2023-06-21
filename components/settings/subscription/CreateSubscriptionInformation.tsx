import ApartmentIcon from '@mui/icons-material/Apartment';
import CheckIcon from '@mui/icons-material/Check';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import { Chip, Divider, Grid, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import Typography from '@mui/material/Typography';

import Button from 'components/common/Button';
import { subscriptionDetails } from 'lib/subscription/constants';

import Legend from '../Legend';

export function CreateSubscriptionInformation({ onClick }: { onClick: () => void }) {
  return (
    <>
      <Legend variantMapping={{ inherit: 'div' }} whiteSpace='normal'>
        Upgrade CharmVerse
      </Legend>
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4} display='flex' flexDirection='column' alignItems='flex-start' gap={1}>
          <Typography variant='h6' mb={1}>
            Free plan
          </Typography>
          <Chip size='small' label='Current Plan' />
          <HomeIcon fontSize='large' />
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography variant='h6' mb={1}>
            Collaborate in public
          </Typography>
          <List>
            {subscriptionDetails.free.map((detail) => (
              <ListItem key={detail}>
                <ListItemIcon>
                  <CheckIcon fontSize='small' />
                </ListItemIcon>
                <ListItemText primary={detail} />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
      <Divider sx={{ mb: 1 }} />
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4} display='flex' flexDirection='column' alignItems='flex-start' gap={1}>
          <Typography variant='h6' mb={1}>
            Community Edition
          </Typography>
          <Chip size='small' sx={{ ml: 1 }} label='Recommended Plan' variant='outlined' />
          <PeopleIcon fontSize='large' />
          <Typography variant='body1' mb={1}>
            Starts at $10/month
          </Typography>
          <Button onClick={onClick}>Upgrade</Button>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography variant='h6' mb={1}>
            Onboard & Engage Community Members
          </Typography>
          <List>
            {subscriptionDetails.community.map((detail) => (
              <ListItem key={detail}>
                <ListItemIcon>
                  <CheckIcon fontSize='small' />
                </ListItemIcon>
                <ListItemText primary={detail} />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
      <Divider sx={{ mb: 1 }} />
      <Grid container spacing={5} sx={{ wrap: { sm: 'nowrap' } }}>
        <Grid item xs={12} sm={4} display='flex' flexDirection='column' alignItems='flex-start' gap={1}>
          <Typography variant='h6' mb={1}>
            Enterprise Edition
          </Typography>
          <ApartmentIcon fontSize='large' />
          <Button variant='text' href='mailto:hello@charmverse.io'>
            Contact us
          </Button>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography variant='h6' mb={1}>
            Advanced control and support for large Communities
          </Typography>
          <List>
            {subscriptionDetails.community.map((detail) => (
              <ListItem key={detail}>
                <ListItemIcon>
                  <CheckIcon fontSize='small' />
                </ListItemIcon>
                <ListItemText primary={detail} />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
    </>
  );
}
