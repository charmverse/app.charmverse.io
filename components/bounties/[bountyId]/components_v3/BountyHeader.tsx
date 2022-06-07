import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ListItemIcon from '@mui/material/ListItemIcon';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Menu, { MenuProps } from '@mui/material/Menu';
import ListItemText from '@mui/material/ListItemText';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Typography from '@mui/material/Typography';
import BountyDelete from 'components/bounties/components/BountyDelete';
import BountyModal from 'components/bounties/components/BountyModal';
import BountyStatusBadge from 'components/bounties/components/BountyStatusBadge';
import Modal from 'components/common/Modal';
import { useBounties } from 'hooks/useBounties';
import useIsAdmin from 'hooks/useIsAdmin';
import { usePopupState, bindTrigger, bindMenu } from 'material-ui-popup-state/hooks';
import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import { Bounty } from '@prisma/client';

const menuPosition: Partial<MenuProps> = {
  anchorOrigin: {
    horizontal: 'right',
    vertical: 'bottom'
  },
  transformOrigin: {
    vertical: 'top',
    horizontal: 'left'
  }
};

interface Props {
  bounty: Bounty
}

export default function BountyHeader ({ bounty }: Props) {
  const { refreshBounty } = useBounties();

  const [user] = useUser();

  const isAdmin = useIsAdmin();

  const bountyEditModal = usePopupState({ variant: 'popover', popupId: 'edit-bounty' });
  const bountyDeleteModal = usePopupState({ variant: 'popover', popupId: 'delete-bounty' });

  const closeSubmissionsModal = usePopupState({ variant: 'popover', popupId: 'close-submissions' });

  const closeBountyModal = usePopupState({ variant: 'popover', popupId: 'close-bounty' });

  const popupState = usePopupState({ variant: 'popover', popupId: 'bounty-actions' });

  async function closeBounty () {

    const updatedBounty = await charmClient.closeBounty(bounty!.id);
    refreshBounty(updatedBounty.id);
    closeBountyModal.close();
  }

  async function closeBountySubmissions () {

    const updatedBounty = await charmClient.closeBountySubmissions(bounty!.id);
    refreshBounty(updatedBounty.id);
    closeSubmissionsModal.close();
  }

  if (!bounty) {
    return null;
  }

  const isBountyCreator = (user?.id === bounty?.createdBy) || isAdmin;

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
              {bounty.title}
            </Box>
            {
          (isAdmin || (isBountyCreator && bounty.status === 'suggestion')) && (
            <>
              <IconButton {...bindTrigger(popupState)}>
                <MoreHorizIcon color='secondary' />
              </IconButton>

              <Menu
                {...bindMenu(popupState)}
                {...menuPosition}
              >

                {
                  (isAdmin || (isBountyCreator && bounty.status === 'suggestion')) && (
                    <Tooltip arrow placement='right' title={`Edit bounty ${bounty.status === 'suggestion' ? 'suggestion' : ''}`}>
                      <MenuItem
                        dense
                        onClick={() => {
                          bountyEditModal.open();
                          popupState.close();
                        }}
                      >
                        <ListItemIcon><EditIcon color='secondary' fontSize='small' /></ListItemIcon>
                        <ListItemText>Edit</ListItemText>
                      </MenuItem>
                    </Tooltip>
                  )
                }

                {
                  (isAdmin && bounty.status !== 'suggestion' && bounty.status !== 'complete' && bounty.status !== 'paid') && (
                    [
                      <Tooltip key='stop-new' arrow placement='right' title={`Prevent new ${bounty.approveSubmitters ? 'applications' : 'submissions'} from being made.`}>
                        <MenuItem
                          dense
                          onClick={() => {
                            closeSubmissionsModal.open();
                            popupState.close();
                          }}
                        >
                          <ListItemIcon><LockIcon color='secondary' fontSize='small' /></ListItemIcon>
                          <ListItemText>Stop new {bounty.approveSubmitters ? 'applications' : 'submissions'}</ListItemText>
                        </MenuItem>
                      </Tooltip>,
                      <Tooltip key='mark-complete' arrow placement='right' title='Mark this bounty complete and auto-reject all non-reviewed submissions'>
                        <MenuItem
                          dense
                          onClick={() => {
                            closeBountyModal.open();
                            popupState.close();
                          }}
                        >
                          <ListItemIcon><CheckCircleIcon color='secondary' fontSize='small' /></ListItemIcon>
                          <ListItemText>Mark as complete</ListItemText>
                        </MenuItem>
                      </Tooltip>
                    ]
                  )
                }

                {
                  (isAdmin || (isBountyCreator && bounty.status === 'suggestion')) && (
                    <Tooltip arrow placement='right' title={`Delete bounty ${bounty.status === 'suggestion' ? 'suggestion' : ''}`}>
                      <MenuItem
                        dense
                        onClick={() => {
                          bountyDeleteModal.open();
                          popupState.close();
                        }}
                      >
                        <ListItemIcon><DeleteIcon color='secondary' /></ListItemIcon>
                        <ListItemText>Delete</ListItemText>
                      </MenuItem>
                    </Tooltip>
                  )
                }

              </Menu>

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
          <BountyStatusBadge bounty={bounty} />
        </Box>
      </Box>

      {/** List of modals */}
      <BountyModal
        onSubmit={bountyEditModal.close}
        mode='update'
        bounty={bounty}
        open={bountyEditModal.isOpen}
        onClose={bountyEditModal.close}
      />

      <Modal open={bountyDeleteModal.isOpen} onClose={bountyDeleteModal.close}>
        <BountyDelete
          bounty={bounty}
          onCancel={bountyDeleteModal.close}
          onDelete={bountyDeleteModal.close}
        />
      </Modal>

      <Modal title='Confirm' open={closeSubmissionsModal.isOpen} onClose={closeSubmissionsModal.close} size='large'>
        <Box>

          <Typography variant='body2' sx={{ mb: 1 }}>
            Do you want to close this bounty to new submissions?
            <br />
            <br />
            The cap of submissions will be updated to the current number of approved or in progress submissions.
            <br />
            <br />
            You can reopen this bounty for new submissions by updating or removing the maximum submissions limit.
          </Typography>

          <Box component='div' sx={{ columnSpacing: 2, mt: 3 }}>
            <Button
              color='primary'
              sx={{ mr: 2, fontWeight: 'bold' }}
              onClick={closeBountySubmissions}
            >Close {bounty.approveSubmitters ? 'applications' : 'submissions'}
            </Button>

            <Button color='secondary' onClick={closeSubmissionsModal.close}>Cancel</Button>
          </Box>
        </Box>
      </Modal>

      <Modal title='Confirm' size='large' open={closeBountyModal.isOpen} onClose={closeBountyModal.close}>
        <Box>

          <Typography variant='body2' sx={{ mb: 1 }}>
            Do you want to close out this bounty?
            <br />
            <br />
            <b>All non-reviewed submissions will be rejected</b>, and this bounty will move to "complete" status.
            <br />
            <br />
            This decision is permanent.
          </Typography>

          <Box component='div' sx={{ columnSpacing: 2, mt: 3 }}>
            <Button
              color='error'
              sx={{ mr: 2, fontWeight: 'bold' }}
              onClick={closeBounty}
            >Close bounty
            </Button>

            <Button color='secondary' onClick={closeBountyModal.close}>Cancel</Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
