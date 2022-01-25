import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import styled from '@emotion/styled';
import Link from '@mui/material/Link';
import PrimaryButton from 'components/common/PrimaryButton';

import logoImage from 'public/images/charmverse_logo.webp';
import splashImage from 'public/images/charmverse_land.webp';
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
          </Grid>
        </Grid>
        Links!
      </Container>
    </Background>
  );
}