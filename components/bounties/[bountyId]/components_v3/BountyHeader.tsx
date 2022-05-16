import { useBounties } from 'hooks/useBounties';
import useIsAdmin from 'hooks/useIsAdmin';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import Box from '@mui/material/Box';
import Alert, { AlertColor } from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Application, Bounty } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import charmClient from 'charmClient';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import Avatar from 'components/common/Avatar';
import Modal from 'components/common/Modal';
import CharmEditor from 'components/common/CharmEditor/CharmEditor';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { useContributors } from 'hooks/useContributors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useENSName from 'hooks/useENSName';
import { useUser } from 'hooks/useUser';
import { usePageTitle } from 'hooks/usePageTitle';
import { getDisplayName } from 'lib/users';
import { eToNumber } from 'lib/utilities/numbers';
import { BountyWithDetails, PageContent } from 'models';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import BountyModal from 'components/bounties/components/BountyModal';
import { FormValues as BountyFormValues } from 'components/bounties/components/BountyEditorForm';
import BountyStatusBadge from 'components/bounties/components/BountyStatusBadge';
import BountyPaymentButton from 'components/bounties/[bountyId]/components/BountyPaymentButton';
import { BountyApplicantList } from 'components/bounties/[bountyId]/components/BountyApplicantList';
import { ApplicationEditorForm } from 'components/bounties/[bountyId]/components/ApplicationEditorForm';
import BountyDelete from 'components/bounties/components/BountyDelete';

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

  console.log('Rendering', !!currentBounty);
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
