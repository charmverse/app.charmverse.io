import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import BountyDelete from 'components/bounties/components/BountyDelete';
import BountyModal from 'components/bounties/components/BountyModal';
import BountyStatusBadge from 'components/bounties/components/BountyStatusBadge';
import Modal from 'components/common/Modal';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';

export default function BountyHeader () {
  const { currentBounty } = useBounties();

  const [currentSpace] = useCurrentSpace();
  const isAdmin = useIsAdmin();

  const router = useRouter();

  const bountyEditModal = usePopupState({ variant: 'popover', popupId: 'edit-bounty' });
  const bountyDeleteModal = usePopupState({ variant: 'popover', popupId: 'delete-bounty' });

  function bountyDeleted () {
    bountyEditModal.close();
    router.push(`/${currentSpace?.domain}/bounties`);
  }

  const viewerCanModifyBounty = isAdmin === true;

  if (!currentBounty) {
    return null;
  }

  return (
    <>
      <Box sx={{
        justifyContent: 'space-between',
        gap: 1,
        display: 'flex'
      }}
      >
        <Box flexGrow={1}>
          <Typography
            variant='h1'
            sx={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '40px',
              fontWeight: 700,
              gap: 1
            }}
          >
            <Box component='span'>
              {currentBounty.title}
            </Box>
            {
          viewerCanModifyBounty === true && (
            <>
              <Tooltip arrow placement='top' title={`Edit bounty ${currentBounty.status === 'suggestion' ? 'suggestion' : ''}`}>
                <IconButton onClick={bountyEditModal.open}>
                  <EditIcon fontSize='medium' />
                </IconButton>
              </Tooltip>
              <Tooltip arrow placement='top' title={`Delete bounty ${currentBounty.status === 'suggestion' ? 'suggestion' : ''}`}>
                <IconButton sx={{ mx: -1 }} onClick={() => {}}>
                  <DeleteIcon fontSize='medium' />
                </IconButton>
              </Tooltip>
            </>
          )
        }
          </Typography>
        </Box>
        <Box sx={{
          display: 'flex',
          alignItems: 'center'
        }}
        >
          <BountyStatusBadge bounty={currentBounty} />
        </Box>
      </Box>

      {/** List of modals */}
      <BountyModal
        onSubmit={() => {}}
        mode='update'
        bounty={currentBounty}
        open={bountyEditModal.isOpen}
        onClose={bountyEditModal.close}
      />

      <Modal open={bountyDeleteModal.isOpen} onClose={bountyDeleteModal.close}>
        <BountyDelete
          bounty={currentBounty}
          onCancel={bountyDeleteModal.close}
          onDelete={bountyDeleted}
        />
      </Modal>
    </>
  );
}
