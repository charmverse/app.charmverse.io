import { Prisma, Space } from '@prisma/client';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Header from 'components/common/base-layout/Header';
import PageWrapper from 'components/common/base-layout/PageWrapper';
import CreateSpaceForm, { getDomainFromName } from 'components/common/CreateSpaceForm';
import charmClient from 'charmClient';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import getDisplayName from 'lib/users/getDisplayName';

export default function CreateSpace () {

  const [user] = useUser();
  const [spaces, setSpaces] = useSpaces();
  const router = useRouter();

  async function addSpace (newSpace: Prisma.SpaceCreateInput) {
    const space = await charmClient.createSpace(newSpace);
    setSpaces([...spaces, space]);
    router.push(`/${space.domain}`);
  }

  const defaultName = `${getDisplayName(user!)}'s Workspace`;
  const defaultValues = {
    name: defaultName,
    domain: getDomainFromName(defaultName)
  };

  return (
    <PageWrapper>
      <Header />
      <Box sx={{ width: 400, maxWidth: '100%', mx: 'auto' }}>
        <CreateSpaceForm defaultValues={defaultValues} onSubmit={addSpace} />
      </Box>
    </PageWrapper>
  );
}
