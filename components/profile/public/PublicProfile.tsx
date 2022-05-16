import { useState } from 'react';
import styled from '@emotion/styled';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import Avatar from 'components/settings/workspace/LargeAvatar';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import TwitterIcon from '@mui/icons-material/Twitter';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import DiscordIcon from 'public/images/discord_logo.svg';
import SvgIcon from '@mui/material/SvgIcon';

const StyledPaper = styled(Paper)`
  background-color: ${({ theme }) => theme.palette.background.light};
  border-radius: 20px;
  padding: 20px;
  border: 1px solid #000;
`;

export default function PublicProfile () {
  const [name, setName] = useState('Andrei');
  const [userImage, setUserImage] = useState('');

  const handleImageUpdate = (url: string) => {
    console.log('Update image');
  };

  return (
    <Grid container>
      <Grid container item xs={12}>
        <StyledPaper elevation={1}>
          <Stack direction='row' spacing={5}>
            <Stack alignItems='center'>
              <Avatar
                name={name}
                variant='rounded'
                spaceImage={userImage}
                updateImage={handleImageUpdate}
                updateImage={(url) => setUserImage(url)}
                displayIcons={true}
              />
              <Typography component='span'>Andrei</Typography>
            </Stack>
            <Grid container direction='row' spacing={1} sx={{ backgroundColor: '#FFF' }}>
              <Grid container item sx={10} justifyContent='space-between'>
                <Grid item container spacing={2}>
                  <Grid item>
                    <TwitterIcon style={{ color: '#00ACEE' }} />
                  </Grid>
                  <Grid item>
                    <Typography component='span'>https://twitter.com/andrei</Typography>
                  </Grid>
                </Grid>
                <Grid item container>
                  <Grid item container spacing={2}>
                    <Grid item>
                      <GitHubIcon style={{ color: '#000000' }} />
                    </Grid>
                    <Grid item>
                      <Typography component='span'>https://github.com/AndreiMitrea</Typography>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item container>
                  <Grid item container spacing={2}>
                    <Grid item>
                      <LinkedInIcon style={{ color: '#0072B1' }} />
                    </Grid>
                    <Grid item>
                      <Typography component='span'>https://linkedin.com/AndreiMitrea</Typography>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item>
                  <Grid item container spacing={2}>
                    <Grid item>
                      <SvgIcon viewBox='0 -5 70 70'><DiscordIcon style={{ color: '#000000' }} /></SvgIcon>
                    </Grid>
                    <Grid item>
                      <Typography component='span'>Andrei7#7045</Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item sx={2}>
                <Button
                  color='secondary'
                  variant='outlined'
                  onClick={() => {}}
                  endIcon={<EditOutlinedIcon fontSize='small' />}
                >
                  Edit
                </Button>
              </Grid>
            </Grid>
          </Stack>
          <Stack
            direction='row'
            justifyContent='space-between'
          >
            <Stack>

            </Stack>
          </Stack>
        </StyledPaper>
      </Grid>
      <Grid item xs={7}>
        <Paper elevation={1}>

        </Paper>
      </Grid>
      <Grid item xs={5}>
        <Paper elevation={1}>

        </Paper>
      </Grid>
    </Grid>
  );
}
