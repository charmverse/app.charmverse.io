// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { Box } from '@mui/system';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { BountyWithDetails } from 'models';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Board } from '../blocks/board';
import mutator from '../mutator';
import { getCard } from '../store/cards';
import { useAppSelector } from '../store/hooks';
import { Utils } from '../utils';
import ConfirmationDialogBox, { ConfirmationDialogBoxProps } from './confirmationDialogBox';
import PageDialog from 'components/common/Page/PageDialog';

type Props = {
  board: Board
  cardId: string
  onClose: () => void
  showCard: (cardId?: string) => void
  readonly: boolean
}

function CreateBountyButton(props: { pageId: string }) {
  const { pageId } = props;
  const { createDraftBounty } = useBounties();
  const { user } = useUser();
  const [space] = useCurrentSpace();
  const [userSpacePermissions] = useCurrentSpacePermissions();

  return (
    <Box sx={{
      whiteSpace: 'nowrap'
    }}
    >
      {!userSpacePermissions?.createBounty || !space || !user ? null : (
        <Button
          disableElevation
          size='small'
          onClick={() => createDraftBounty({ pageId, userId: user.id, spaceId: space.id })}
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
  const { pages } = usePages()
  const { draftBounty, cancelDraftBounty, refreshBounty, bounties } = useBounties()
  const router = useRouter();
  const isSharedPage = router.route.startsWith('/share')
  const cardPage = pages[cardId]
  const [spacePermissions] = useCurrentSpacePermissions()
  const [bounty, setBounty] = useState<BountyWithDetails | null>(null)

  useEffect(() => {
    setBounty(bounties.find(bounty => bounty.page?.id === cardId) ?? null)
  }, [bounties.length, cardId])

  // clear draft bounty on close, just in case
  useEffect(() => {
    return () => {
      cancelDraftBounty()
    }
  }, []);

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
    handleDeleteCard()
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
          spacePermissions?.createBounty && !isSharedPage && cardPage && !bounty && !draftBounty && !readonly && <CreateBountyButton pageId={cardId} />
        }
        page={cardPage}
      />

      {showConfirmationDialogBox && <ConfirmationDialogBox dialogBox={confirmDialogProps} />}
    </>
  ) : null
}
export default CardDialog;
