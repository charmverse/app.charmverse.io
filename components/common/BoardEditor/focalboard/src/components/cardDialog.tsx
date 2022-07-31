// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LinkIcon from '@mui/icons-material/Link';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { mutate } from 'swr';
import { Board } from '../blocks/board';
import mutator from '../mutator';
import { getCard } from '../store/cards';
import { useAppSelector } from '../store/hooks';
import { getUserBlockSubscriptionList } from '../store/initialLoad';
import { Utils } from '../utils';
import Menu from '../widgets/menu';
import CardDetail from './cardDetail/cardDetail';
import ConfirmationDialogBox, { ConfirmationDialogBoxProps } from './confirmationDialogBox';
import Dialog from './dialog';

type Props = {
    board: Board
    cardId: string
    onClose: () => void
    showCard: (cardId?: string) => void
    readonly: boolean
}

function CardDialog (props: Props): JSX.Element | null {
  const { board } = props;
  const card = useAppSelector(getCard(props.cardId));
  const intl = useIntl();
  const [space] = useCurrentSpace();
  const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false);
  const { showMessage } = useSnackbar();
  const makeTemplateClicked = async () => {
    if (!card) {
      Utils.assertFailure('card');
      return;
    }

    if (pages[props.cardId] && space) {
      await mutator.duplicateCard(
        {
          cardId: props.cardId,
          board,
          description: intl.formatMessage({ id: 'Mutator.new-template-from-card', defaultMessage: 'new template from card' }),
          asTemplate: true,
          afterRedo: async (newCardId) => {
            props.showCard(newCardId);
            mutate(`pages/${space.id}`);
          },
          beforeUndo: async () => {
            props.showCard(undefined);
          },
          cardPage: pages[props.cardId]!
        }
      );
    }
  };
  const handleDeleteCard = async () => {
    if (!card) {
      Utils.assertFailure();
      return;
    }
    // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteCard, {board: props.board.id, view: props.activeView.id, card: card.id})
    await mutator.deleteBlock(card, 'delete card');
    props.onClose();
  };

  const confirmDialogProps: ConfirmationDialogBoxProps = {
    heading: intl.formatMessage({ id: 'CardDialog.delete-confirmation-dialog-heading', defaultMessage: 'Confirm card delete?' }),
    confirmButtonText: intl.formatMessage({ id: 'CardDialog.delete-confirmation-dialog-button-text', defaultMessage: 'Delete' }),
    onConfirm: handleDeleteCard,
    onClose: () => {
      setShowConfirmationDialogBox(false);
    }
  };

  const handleDeleteButtonOnClick = () => {
    // use may be renaming a card title
    // and accidently delete the card
    // so adding des
    if (card?.title === '' && card?.fields.contentOrder.length === 0) {
      handleDeleteCard();
      return;
    }

    setShowConfirmationDialogBox(true);
  };

  const menu = (
    <Menu position='bottom-end'>
      <Menu.Text
        id='delete'
        icon={<DeleteOutlineIcon fontSize='small' />}
        name='Delete'
        onClick={handleDeleteButtonOnClick}
      />
      <Menu.Text
        icon={<LinkIcon fontSize='small' />}
        id='copy'
        name={intl.formatMessage({ id: 'CardDialog.copyLink', defaultMessage: 'Copy link' })}
        onClick={() => {
          let cardLink = window.location.href;

          const queryString = new URLSearchParams(window.location.search);
          if (queryString.get('cardId') !== card!.id) {
            const newUrl = new URL(window.location.toString());
            newUrl.searchParams.set('cardId', card!.id);
            cardLink = newUrl.toString();
          }

          Utils.copyTextToClipboard(cardLink);
          showMessage('Copied card link to clipboard', 'success');
        }}
      />
      {/* {(card && !card.fields.isTemplate) &&
                <Menu.Text
                    id='makeTemplate'
                    name='New template from card'
                    onClick={makeTemplateClicked}
                />
            } */}
    </Menu>
  );

  const { pages } = usePages();
  const followingCards = useAppSelector(getUserBlockSubscriptionList);
  const isFollowingCard = Boolean(followingCards.find((following) => following.blockId === props.cardId));
  const router = useRouter();
  const isSharedPage = router.route.startsWith('/share');

  return card && pages[card.id] ? (
    <>
      <Dialog
        onClose={props.onClose}
        toolsMenu={!props.readonly && menu}
        hideCloseButton={true}
        toolbar={!isSharedPage && (
        <Button
          size='small'
          color='secondary'
          href={`/${router.query.domain}/${pages[card.id]!.path}`}
          variant='text'
          startIcon={<OpenInFullIcon fontSize='small' />}
        >
          Open as Page
        </Button>
        )}
      >
        {card && card.fields.isTemplate
                    && (
                    <div className='banner'>
                      <FormattedMessage
                        id='CardDialog.editing-template'
                        defaultMessage="You're editing a template."
                      />
                    </div>
                    )}

        {card
                    && (
                    <CardDetail
                      card={card}
                      readonly={props.readonly || isSharedPage}
                    />
                    )}

        {!card
                    && (
                    <div className='banner error'>
                      <FormattedMessage
                        id='CardDialog.nocard'
                        defaultMessage="This card doesn't exist or is inaccessible."
                      />
                    </div>
                    )}
      </Dialog>

      {showConfirmationDialogBox && <ConfirmationDialogBox dialogBox={confirmDialogProps} />}
    </>
  ) : null;
}

export default CardDialog;
