// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { List, ListItemButton, ListItemText } from '@mui/material';
import { Box } from '@mui/system';
import { Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { BountyWithDetails } from 'models';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Board } from '../blocks/board';
import mutator from '../mutator';
import { getCard } from '../store/cards';
import { useAppSelector } from '../store/hooks';
import { Utils } from '../utils';
import Menu from '../widgets/menu';
import ConfirmationDialogBox, { ConfirmationDialogBoxProps } from './confirmationDialogBox';
import Dialog from './dialog';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CardDetail from './cardDetail/cardDetail';
import PageDialog from 'components/common/Page/PageDialog';

type Props = {
  board: Board
  cardId: string
  onClose: () => void
  showCard: (cardId?: string) => void
  readonly: boolean
}

function CreateBountyButton(props: {
  onClick: (createdBounty: BountyWithDetails) => void
  pageId: string
}) {
  const { onClick, pageId } = props;
  const { setBounties } = useBounties();
  const [user] = useUser();
  const [space] = useCurrentSpace();
  const [userSpacePermissions] = useCurrentSpacePermissions();

  return (
    <Box sx={{
      whiteSpace: 'nowrap'
    }}
    >
      {!userSpacePermissions?.createBounty || !space || !user ? null : (
        <Button onClick={async () => {
          const createdBounty = await charmClient.createBounty({
            chainId: 1,
            status: 'open',
            spaceId: space.id,
            createdBy: user.id,
            rewardAmount: 1,
            rewardToken: 'ETH',
            linkedPageId: pageId,
            permissions: {
              submitter: [{
                group: 'space',
                id: space.id
              }]
            }
          });
          setBounties((bounties) => [...bounties, createdBounty]);
          onClick(createdBounty);
        }}
        >
          Convert to bounty
        </Button>
      )}
    </Box>
  );
}

const CardDialog = (props: Props): JSX.Element | null => {
  const { cardId, readonly, onClose } = props;
  const card = useAppSelector(getCard(cardId))
  const intl = useIntl()
  const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false)
  const { pages, getPagePermissions } = usePages()
  const { refreshBounty, bounties } = useBounties()
  const router = useRouter();
  const isSharedPage = router.route.startsWith('/share')
  const cardPage = pages[cardId]
  const [spacePermissions] = useCurrentSpacePermissions()
  const [bounty, setBounty] = useState<BountyWithDetails | null>(null)
  const pagePermission = cardPage ? getPagePermissions(cardPage.id) : null
  const { showMessage } = useSnackbar()

  useEffect(() => {
    setBounty(bounties.find(bounty => bounty.page?.id === cardId) ?? null)
  }, [bounties, cardId])

  const handleDeleteCard = async () => {
    if (!card) {
      Utils.assertFailure()
      return
    }
    // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteCard, {board: props.board.id, view: props.activeView.id, card: card.id})
    await mutator.deleteBlock(card, 'delete card')
    onClose()
  }

  const confirmDialogProps: ConfirmationDialogBoxProps = {
    heading: intl.formatMessage({ id: 'CardDialog.delete-confirmation-dialog-heading', defaultMessage: 'Confirm card delete?' }),
    confirmButtonText: intl.formatMessage({ id: 'CardDialog.delete-confirmation-dialog-button-text', defaultMessage: 'Delete' }),
    onConfirm: handleDeleteCard,
    onClose: () => {
      setShowConfirmationDialogBox(false)
    },
  }

  const handleDeleteButtonOnClick = () => {
    // use may be renaming a card title
    // and accidently delete the card
    // so adding des
    if (card?.title === '' && card?.fields.contentOrder.length === 0) {
      handleDeleteCard()
      return
    }

    setShowConfirmationDialogBox(true)
  }

  async function closeBounty () {
    const updatedBounty = await charmClient.closeBounty(bounty!.id);
    refreshBounty(updatedBounty.id);
  }

  return card && pages[card.id] ? (
    <>
      <PageDialog
        onClose={onClose}
        readOnly={readonly}
        bounty={bounty}
        onClickDelete={handleDeleteButtonOnClick}
        onMarkCompleted={closeBounty}
        toolbar={
          spacePermissions?.createBounty && !isSharedPage && cardPage && !bounty && !readonly && <CreateBountyButton onClick={(createdBounty) => {
            setBounty(createdBounty)
          }} pageId={cardId} />
        }
        page={cardPage}
      />

      {showConfirmationDialogBox && <ConfirmationDialogBox dialogBox={confirmDialogProps} />}
    </>
  ) : null
}
export default CardDialog;
