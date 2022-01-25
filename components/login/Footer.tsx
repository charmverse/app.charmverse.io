import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import styled from '@emotion/styled';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import DiscordIcon from 'public/images/discord_logo.svg';
import SvgIcon from '@mui/material/SvgIcon';

import { darkGreyColor, lightGreyColor } from 'theme/colors';

import { Container } from './SplashImage';

const Background = styled(Box)`
  background-color: ${darkGreyColor};
  color: ${lightGreyColor};
`;

const LinkHeader = styled(Typography)`
  text-transform: uppercase;
  font-size: 1.3em;
  font-weight: bold;
  margin: 1em 0;
  border-top: 4px solid #999;
  padding-top: .5em;
`;

const StyledLink = styled(Link)`
  color: inherit;
  display: block;
  &:hover {
    color: inherit;
  }
`;

export default function Footer () {
  return (
    <Background mt={6} sx={{ flexGrow: 1 }}>
      <Container py={6} px={3}>
        <Grid container spacing={12}>
          <Grid item xs={12} sm={4}>
            <LinkHeader>
              Links
            </LinkHeader>
            <StyledLink href='https://charmverse.io/privacy-policy' target='_blank'>Privacy Policy</StyledLink>
            <StyledLink href='https://charmverse.io/terms' target='_blank'>Terms</StyledLink>
          </Grid>
          <Grid item xs={12} sm={4}>
            <LinkHeader>
              About
            </LinkHeader>
            <StyledLink href='mailto:hello@charmverse.io'>hello@charmverse.io</StyledLink>
            <Typography>New York, NY</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <LinkHeader>
              Social
            </LinkHeader>
            <Box display='flex' alignItems='center'>
              <IconButton sx={{ mr: 1 }} color='white' href='https://www.linkedin.com/company/charmverse' target='_blank'>
                <LinkedInIcon />
              </IconButton>
              <IconButton sx={{ mr: 1 }} color='white' href='https://twitter.com/charmverse' target='_blank'>
                <TwitterIcon />
              </IconButton>
              <IconButton sx={{ mr: 1 }} color='white' href='https://www.facebook.com/charmverse.io' target='_blank'>
                <FacebookIcon />
              </IconButton>
              <IconButton sx={{ mr: 1 }} color='white' href='https://discord.gg/UEsngsk8E2' target='_blank'>
                <SvgIcon viewBox='0 -5 70 70'><DiscordIcon style={{ fill: '#fff' }} /></SvgIcon>
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Background>
  );
}