import Typography from '@mui/material/Typography';
import { ShareModal } from 'lit-access-control-conditions-modal';
import Legend from './Legend';
import Button from '../common/Button';

export default function TokenGates ({ isAdmin, spaceId }: { isAdmin?: boolean, spaceId: string }) {

  const sharingItems = [{ name: 'my workspace' }];

  function getSharingLink () {
    return '';
  }

  function onClose () {

  }

  function onAccessControlConditionsSelected (...args: any[]) {
    console.log('onAccessControlConditionsSelected', args);
  }

  return (
    <>
      <Legend>
        Token Gates
        {isAdmin && <Button size='small' variant='outlined' sx={{ float: 'right' }}>Add a gate</Button>}
      </Legend>
      <Typography color='secondary'>No token gates yet</Typography>
      <ShareModal
        onClose={onClose}
        sharingItems={sharingItems}
        onAccessControlConditionsSelected={onAccessControlConditionsSelected}
        getSharingLink={getSharingLink}
        // showStep={shareModalStep}
      />
    </>
  );
}
