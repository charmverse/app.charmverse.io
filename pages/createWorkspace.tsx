import { Prisma, Space } from '@prisma/client';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Header from 'components/common/base-layout/Header';
import PageWrapper from 'components/common/base-layout/PageWrapper';
import CreateWorkspaceForm from 'components/common/CreateWorkspaceForm';
import charmClient from 'charmClient';

export default function CreateWorkspace () {

  const router = useRouter();

  async function addSpace (newSpace: Prisma.SpaceCreateInput) {
    const space = await charmClient.createSpace(newSpace);
    setTimeout(() => {
      router.push(`/${space.domain}`);
    }, 100);
  }

  return (
    <PageWrapper>
      <Header />
      <Box sx={{ width: 400, maxWidth: '100%', mx: 'auto' }}>
        <CreateWorkspaceForm onSubmit={addSpace} />
      </Box>
    </PageWrapper>
  );
}
