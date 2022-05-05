import { Avatar, Box, Divider, Grid, Typography } from '@mui/material';

type ProfileHeaderProps = {
  name: string;
  profileImageURL: string;
};

export function ProfileHeader ({ name, profileImageURL }: ProfileHeaderProps) {

  return (
    <Box mt={1} mb={4}>
      <Grid container alignItems='center' justifyContent='space-between' pb={2}>
        <Grid item xs={8}>
          <Typography variant='h1'>{name}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Avatar alt={name} src={profileImageURL} sx={{ width: 70, height: 70 }} />
        </Grid>
      </Grid>
      <Divider sx={{ borderBottomWidth: 3 }} />
    </Box>
  );
}
