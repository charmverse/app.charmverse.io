import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';
import Legend from 'components/settings/Legend';
import Button from 'components/common/Button';
import Typography from '@mui/material/Typography';
import ContributorRow from 'components/settings/ContributorRow';
import { setTitle } from 'hooks/usePageTitle';
import { useContributors } from 'hooks/useContributors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

export default function ContributorSettings () {

  const [space] = useCurrentSpace();
  const [contributors] = useContributors();

  setTitle('Contributors');

  return (
    <>
      <Legend>
        Invite Links
        <Button color='secondary' size='small' variant='outlined' sx={{ float: 'right' }}>Add a link</Button>
      </Legend>
      <Typography color='secondary'>No invite links yet</Typography>

      <Legend>
        Token Gates
        <Button color='secondary' size='small' variant='outlined' sx={{ float: 'right' }}>Add a gate</Button>
      </Legend>
      <Typography color='secondary'>No token gates yet</Typography>

      <Legend>Current Contributors</Legend>
      {contributors.map(contributor => (
        <ContributorRow key={contributor.username} contributor={contributor} spaceId={space.id} />
      ))}
    </>
  );
}

ContributorSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};
