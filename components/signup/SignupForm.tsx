import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Image from 'components/common/Image';
import Typography from '@mui/material/Typography';
import styled from '@emotion/styled';
import PrimaryButton from 'components/common/PrimaryButton';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import { useRouter } from 'next/router';

import gatesImage from 'public/images/artwork/gates.png';
import rocketImage from 'public/images/artwork/rocket.png';

export const Content = styled(Box)`
  max-width: 100%;
  width: 1170px;
  margin: 0 auto;
`;

const AdventureContainer = styled.div`
  text-align: center;
`;

export default function SignupPageContent () {

  const { account } = useWeb3React();
  const [, setUser] = useUser();
  const router = useRouter();

  async function createAccount () {
    const newUser = await charmClient.createUser({ address: account! });
    setUser(newUser);
    setTimeout(() => {
      router.push('/createWorkspace');
    }, 100);
  }

  return (
    <Content px={3}>
      <Typography gutterBottom variant='h1' align='center'>
        Welcome, stranger!
      </Typography>
      <Typography gutterBottom variant='h2' align='center'>
        Choose your adventure:
      </Typography>
      <Grid container sx={{ mt: 3 }}>
        <Grid item xs container alignItems='center' justifyContent='flex-end' flexDirection='column'>
          <Image mb={3} src={rocketImage} />
          <PrimaryButton size='large' onClick={createAccount}>
            Create a new workspace
          </PrimaryButton>
        </Grid>
        <Grid item xs container alignItems='center' justifyContent='flex-end' flexDirection='column'>
          <Image mb={3} src={gatesImage} />
          <PrimaryButton size='large'>
            Join an existing workspace
          </PrimaryButton>
        </Grid>
      </Grid>
    </Content>
  );
}
