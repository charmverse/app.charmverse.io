import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Bounty } from '@prisma/client';
import { Modal } from 'components/common/Modal';
import { useBounties } from 'hooks/useBounties';
import useIsAdmin from 'hooks/useIsAdmin';
import { usePopupState } from 'material-ui-popup-state/hooks';
import charmClient from 'charmClient';
import BountyModal from '../components/BountyModal';
import BountyDelete from './BountyDelete';

interface Props {
  bounty: Bounty
}

export default function BountySuggestionApproval ({ bounty }: Props) {

  const isAdmin = useIsAdmin();
  const { refreshBounty } = useBounties();

  const bountyApproveModal = usePopupState({ variant: 'popover', popupId: 'approve-bounty' });
  const bountyDeleteModal = usePopupState({ variant: 'popover', popupId: 'delete-bounty-suggestion' });
  const bountyEditModal = usePopupState({ variant: 'popover', popupId: 'edit-bounty-to-approve' });

  const userCanDecideOnSuggestion = bounty.status === 'suggestion' && isAdmin;

  // All conditions fulfilled to approve the bounty
  const approvableBounty = userCanDecideOnSuggestion && bounty.rewardAmount > 0;

  async function approveBountySuggestion () {
    await charmClient.reviewBountySuggestion({
      bountyId: bounty.id,
      decision: 'approve'
    });
    refreshBounty(bounty.id);
    bountyApproveModal.close();
  }

  if (!userCanDecideOnSuggestion) {
    return null;
  }

  return (
    <>
      <Box>
        <Tooltip arrow placement='top' title={!approvableBounty ? 'You must define a reward amount before you can approve this bounty suggestion.' : ''}>
          <Button
            color='success'
            onClick={
              approvableBounty ? bountyApproveModal.open
                : bountyEditModal.open
            }
            sx={{ mr: 2 }}
          >Approve suggestion
          </Button>
        </Tooltip>

        <Tooltip arrow placement='top' title='Delete this suggestion'>
          <Button
            color='error'
            onClick={bountyDeleteModal.open}
          >Reject suggestion
          </Button>
        </Tooltip>
      </Box>

      {/* Modals */}

      {/* Form for setting valid reward amount amount */}
      <BountyModal
        onSubmit={bountyEditModal.close}
        mode='update'
        bounty={bounty}
        open={bountyEditModal.isOpen}
        onClose={bountyEditModal.close}
        focusKey='rewardAmount'
      />

      {/* Reject bounty suggestion */}
      <Modal title='Reject bounty suggestion' open={bountyDeleteModal.isOpen} onClose={bountyDeleteModal.close}>
        <BountyDelete bounty={bounty} onCancel={bountyDeleteModal.close} onDelete={bountyDeleteModal.close} />
      </Modal>

      {/* Confirm bounty approval */}
      <Modal title='Approve bounty suggestion' open={bountyApproveModal.isOpen} onClose={bountyApproveModal.close}>

        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
          {
                'Confirm you want to approve this bounty.\r\n\r\nIts status will be changed to \'open\' and workspace members will be able to apply.'
                }

        </Typography>

        <Box component='div' sx={{ columnSpacing: 2, mt: 3 }}>
          <Button
            color='primary'
            sx={{ mr: 2, fontWeight: 'bold' }}
            onClick={approveBountySuggestion}
          >
            Approve
          </Button>

          <Button color='secondary' onClick={bountyApproveModal.close}>Cancel</Button>
        </Box>
      </Modal>
    </>
  );
}
