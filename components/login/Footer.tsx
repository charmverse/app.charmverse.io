import styled from '@emotion/styled';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';

import DiscordIcon from 'public/images/discord_logo.svg';

import { Container } from './LoginPageContent';

const Background = styled(Box)`
  background-color: ${({ theme }) => theme.palette.background.dark};
  flex-grow: 1;
`;

const LinkHeader = styled(Typography)`
  color: ${({ theme }) => theme.palette.secondary.dark};
  text-transform: uppercase;
  font-size: 1.3em;
  font-weight: bold;
  margin-bottom: 1em;
  border-top: 3px solid ${({ theme }) => theme.palette.divider};
  padding-top: .5em;
`;

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.palette.secondary.main};
  display: block;
  &:hover {
    color: ${({ theme }) => theme.palette.secondary.dark};
  }
`;

const StyledIconButton = styled(IconButton)`
  color: ${({ theme }) => theme.palette.secondary.main};
  margin-right: ${({ theme }) => theme.spacing(1)};
  &:hover {
    color: ${({ theme }) => theme.palette.secondary.dark};
  }
` as typeof IconButton;

export default function Footer () {
  return (
    <Background mt={6} sx={{ flexGrow: 1, textAlign: { xs: 'center', sm: 'left' } }}>
      <Container py={9} px={3}>
        <Grid container spacing={6}>
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
            <Typography color='secondary'>New York, NY</Typography>
          </Grid>
          <Grid item xs={12} sm={4} alignItems='center'>
            <LinkHeader>
              Social
            </LinkHeader>
            <Box display='flex' alignItems='center' sx={{ justifyContent: { xs: 'center', sm: 'left' } }}>
              <StyledIconButton href='https://www.linkedin.com/company/charmverse' target='_blank'>
                <LinkedInIcon />
              </StyledIconButton>
              <StyledIconButton href='https://twitter.com/charmverse' target='_blank'>
                <TwitterIcon />
              </StyledIconButton>
              <StyledIconButton href='https://www.facebook.com/charmverse.io' target='_blank'>
                <FacebookIcon />
              </StyledIconButton>
              <StyledIconButton href='https://discord.gg/ACYCzBGC2M' target='_blank'>
                <SvgIcon viewBox='0 -5 70 70'><DiscordIcon /></SvgIcon>
              </StyledIconButton>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Background>
  );
}
