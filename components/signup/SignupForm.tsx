
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';

import Image from 'components/common/Image';
import Link from 'components/common/Link';
import PrimaryButton from 'components/common/PrimaryButton';
import { useUser } from 'hooks/useUser';
import gatesImage from 'public/images/artwork/gates.png';
import rocketImage from 'public/images/artwork/rocket.png';

export const Content = styled(Box)`
  max-width: 100%;
  width: 1000px;
  margin: 0 auto;
`;

const AdventureCard = styled(Card)`
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 490px;
  padding: ${({ theme }) => theme.spacing(6)};
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows[12]};
  }
`;

const ImageContainer = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

export default function SignupPageContent () {

  const router = useRouter();
  const { user } = useUser();

  const welcomeMessage = `Welcome, ${user && user.username}!`;

  return (
    <Content px={3}>
      <Box mb={6}>
        <Typography gutterBottom variant='h1' sx={{ fontSize: '2.5rem' }} align='center'>
          {welcomeMessage}
        </Typography>
        {/* <Typography variant='h2' align='center'>
          Choose your adventure:
        </Typography> */}
      </Box>
      <Grid container spacing={6} alignItems='stretch' sx={{ mb: 6 }}>
        <Grid item xs sx={{ height: '100%', margin: 'auto' }}>
          <Link href='/createWorkspace'>
            <AdventureCard>
              <ImageContainer>
                <Image src={rocketImage} />
              </ImageContainer>
              <PrimaryButton size='large' data-test='goto-create-workspace'>
                Create a new workspace
              </PrimaryButton>
            </AdventureCard>
          </Link>
        </Grid>
        <Grid item xs>
          <Link href='/join'>
            <AdventureCard>
              <ImageContainer>
                <Image src={gatesImage} />
              </ImageContainer>
              <PrimaryButton size='large'>
                Join an existing workspace
              </PrimaryButton>
            </AdventureCard>
          </Link>
        </Grid>
      </Grid>
    </Content>
  );
}
