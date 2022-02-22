import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Image from 'components/common/Image';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import styled from '@emotion/styled';
import PrimaryButton from 'components/common/PrimaryButton';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import { useRouter } from 'next/router';
import { shortenHex } from 'lib/strings';
import useENSName from 'hooks/useENSName';

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
  height: 100%;
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

  const { account } = useWeb3React();
  const ensName = useENSName(account);
  const [, setUser] = useUser();
  const router = useRouter();

  async function createAccount () {
    const newUser = await charmClient.createUser({ address: account! });
    setUser(newUser);
    router.push('/createWorkspace');
  }

  const welcomeMessage = `Welcome, ${account ? ensName || shortenHex(account) : ''}!`;

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
      <Grid container spacing={6}>
        <Grid item xs sm={6} sx={{ margin: 'auto' }}>
          <AdventureCard onClick={createAccount}>
            <ImageContainer>
              <Image src={rocketImage} />
            </ImageContainer>
            <PrimaryButton size='large'>
              Create a new workspace
            </PrimaryButton>
          </AdventureCard>
        </Grid>
        {/* <Grid item xs>
          <AdventureCard>
            <ImageContainer>
              <Image src={gatesImage} />
            </ImageContainer>
            <PrimaryButton size='large'>
              Join an existing workspace
            </PrimaryButton>
          </AdventureCard>
        </Grid> */}
      </Grid>
    </Content>
  );
}
