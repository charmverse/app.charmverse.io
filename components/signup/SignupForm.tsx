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

import gatesImage from 'public/images/artwork/gates.png';
import rocketImage from 'public/images/artwork/rocket.png';

export const Content = styled(Box)`
  max-width: 100%;
  width: 1170px;
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
    box-shadow: ${({ theme }) => theme.shadows[15]};
  }
`;

export default function SignupPageContent () {

  const { account } = useWeb3React();
  const [, setUser] = useUser();
  const router = useRouter();

  async function createAccount () {
    const newUser = await charmClient.createUser({ address: account! });
    setUser(newUser);
    router.push('/createWorkspace');
  }

  const welcomeMessage = `Welcome, ${account ? shortenHex(account) : ''}!`;

  return (
    <Content px={3}>
      <Typography gutterBottom variant='h1' align='center'>
        {welcomeMessage}
      </Typography>
      <Typography gutterBottom variant='h2' align='center'>
        Choose your adventure:
      </Typography>
      <Grid container sx={{ mt: 10 }} columnSpacing={6}>
        <Grid item xs>
          <AdventureCard onClick={createAccount}>
            <Image mb={3} src={rocketImage} />
            <PrimaryButton size='large'>
              Create a new workspace
            </PrimaryButton>
          </AdventureCard>
        </Grid>
        <Grid item xs>
          <AdventureCard>
            <Image mb={3} src={gatesImage} />
            <PrimaryButton size='large'>
              Join an existing workspace
            </PrimaryButton>
          </AdventureCard>
        </Grid>
      </Grid>
    </Content>
  );
}
