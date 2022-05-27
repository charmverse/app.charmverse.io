import { ReactElement } from 'react';
import PageLayout from 'components/profile/components/ProfileLayout';
import { setTitle } from 'hooks/usePageTitle';
import PublicProfile from 'components/profile/public';
import { useUser } from 'hooks/useUser';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import Link from 'next/link';

export default function PublicProfilePage () {

  setTitle('Public Profile');

  const [user, setUser] = useUser();

  if (!user) {
    return null;
  }

  return (
    <>
      <Box display='flex' gap={1} alignItems='center'>
        <Link href='/profile/tasks'>
          <IconButton>
            <ArrowBackIosNewIcon />
          </IconButton>
        </Link>
        <Typography component='span' fontSize='1.4em' fontWeight={700}>My Public Profile</Typography>
      </Box>
      <PublicProfile user={user} updateUser={setUser} />
    </>
  );

}

PublicProfilePage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
