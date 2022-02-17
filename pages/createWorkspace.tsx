import { Prisma, Space } from '@prisma/client';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Header from 'components/common/base-layout/Header';
import PageWrapper from 'components/common/base-layout/PageWrapper';
import CreateSpaceForm from 'components/common/CreateSpaceForm';
import charmClient from 'charmClient';
import { useSpaces } from 'hooks/useSpaces';

export default function CreateSpace () {

  const [spaces, setSpaces] = useSpaces();
  const router = useRouter();

  async function addSpace (newSpace: Prisma.SpaceCreateInput) {
    const space = await charmClient.createSpace(newSpace);

    setSpaces([...spaces, space]);
    router.push(`/${space.domain}`);
  }

  return (
    <PageWrapper>
      <Header />
      <Box sx={{ width: 400, maxWidth: '100%', mx: 'auto' }}>
        <CreateSpaceForm onSubmit={addSpace} />
      </Box>
    </PageWrapper>
  );
}
