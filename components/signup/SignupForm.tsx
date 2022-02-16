import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Image from 'next/image';
import styled from '@emotion/styled';
import PrimaryButton from 'components/common/PrimaryButton';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import { useRouter } from 'next/router';

import splashImage from 'public/images/charmverse_world.png';

export const Container = styled(Box)`
  max-width: 100%;
  width: 1170px;
  margin: 0 auto;
  height: 400px;
  align-items: center;
`;

const ImageWrapper = styled(Box)`
  ${({ theme }) => theme.palette.mode === 'dark' && 'filter: invert(100%);'}
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
    <Container px={3}>
      <Grid container spacing={10}>
        <Grid item xs container alignItems='center'>
          <Box display='flex' justifyContent='center'>
            <PrimaryButton size='large' onClick={createAccount}>
              Create a new workspace
            </PrimaryButton>
          </Box>
        </Grid>
        <Grid item xs alignItems='center'>
          <Box display='flex' justifyContent='center'>
            <PrimaryButton size='large'>
              Join an existing workspace
            </PrimaryButton>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
