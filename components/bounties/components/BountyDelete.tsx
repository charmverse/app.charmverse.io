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
import { Modal } from 'components/common/Modal';
import CharmEditor from 'components/common/CharmEditor/CharmEditor';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { useContributors } from 'hooks/useContributors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useBounties } from 'hooks/useBounties';
import useENSName from 'hooks/useENSName';
import { useUser } from 'hooks/useUser';
import { usePageTitle } from 'hooks/usePageTitle';
import { getDisplayName } from 'lib/users';
import { eToNumber } from 'lib/utilities/numbers';
import { BountyWithDetails, PageContent } from 'models';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import useIsAdmin from 'hooks/useIsAdmin';

interface Props {
  bounty: Bounty
  onDelete: () => void
  onCancel: () => void
}

export default function BountyDelete ({ bounty, onCancel, onDelete }: Props) {

  const { deleteBounty } = useBounties();

  return (
    <Box>
      {
      bounty.status !== 'open' && (
      <Typography sx={{ mb: 1 }}>
        {
          (bounty.status === 'complete' || bounty.status === 'paid') ? 'This bounty is already complete.' : 'This is bounty in progress.'
        }

      </Typography>
      )
    }

      <Typography>
        Are you sure you want to delete this bounty?
      </Typography>

      <Box component='div' sx={{ columnSpacing: 2, mt: 3 }}>
        <Button
          color='error'
          sx={{ mr: 2, fontWeight: 'bold' }}
          onClick={() => {
            deleteBounty(bounty.id)
              .then(() => onDelete());
          }}
        >Delete bounty
        </Button>

        <Button color='secondary' onClick={onCancel}>Cancel</Button>
      </Box>
    </Box>
  );
}
