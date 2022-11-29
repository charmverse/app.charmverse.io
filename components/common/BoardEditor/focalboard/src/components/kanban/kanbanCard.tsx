import styled from '@emotion/styled';
import { Box } from '@mui/material';
import Link from '@mui/material/Link';
import type { CryptoCurrency } from 'connectors';
import { TokenLogoPaths } from 'connectors';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { mutate } from 'swr';

import { BountyStatusChip } from 'components/bounties/components/BountyStatusBadge';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import { PageActions } from 'components/common/PageActions';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { isTouchScreen } from 'lib/utilities/browser';

import type { Board, IPropertyTemplate } from '../../blocks/board';
import type { Card } from '../../blocks/card';
import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import { Utils } from '../../utils';
import Tooltip from '../../widgets/tooltip';
import type { ConfirmationDialogBoxProps } from '../confirmationDialogBox';
import ConfirmationDialogBox from '../confirmationDialogBox';
import PropertyValueElement from '../propertyValueElement';

type Props = {
  card: Card;
  board: Board;
  visiblePropertyTemplates: IPropertyTemplate[];
  isSelected: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  readOnly: boolean;
  onDrop: (srcCard: Card, dstCard: Card) => void;
  showCard: (cardId: string | null) => void;
  isManualSort: boolean;
};

const BountyFooter = styled.div`
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding-top: ${({ theme }) => theme.spacing(1)};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

const CurrencyIcon = styled.span`
  margin-right: ${({ theme }) => theme.spacing(0.5)};
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledBox = styled(Box)`
  ${hoverIconsStyle({ absolutePositioning: true })}
`;

const KanbanCard = React.memo((props: Props) => {
  const { card, board } = props;
  const intl = useIntl();
  const [isDragging, isOver, cardRef] = useSortable('card', card, !props.readOnly && !isTouchScreen(), props.onDrop);
  const visiblePropertyTemplates = props.visiblePropertyTemplates || [];
  let className = props.isSelected ? 'KanbanCard selected' : 'KanbanCard';
  if (props.isManualSort && isOver) {
    className += ' dragover';
  }
  const space = useCurrentSpace();

  const { bounties } = useBounties();
  const linkedBounty = bounties.find((bounty) => bounty.page?.id === card.id);

  const { pages, getPagePermissions } = usePages();
  const cardPage = pages[card.id];
  const router = useRouter();
  const domain = router.query.domain || /^\/share\/(.*)\//.exec(router.asPath)?.[1];
  const fullPageUrl = router.route.startsWith('/share')
    ? `/share/${domain}/${cardPage?.path}`
    : `/${domain}/${cardPage?.path}`;

  // Check if the current user is an admin, admin means implicit full access
  const pagePermissions = getPagePermissions(card.id);
  const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false);
  const handleDeleteCard = async () => {
    if (!card) {
      Utils.assertFailure();
      return;
    }
    if (pagePermissions.delete) {
      await mutator.deleteBlock(card, 'delete card');
      mutate(`pages/${space?.id}`);
    }
  };
  const confirmDialogProps: ConfirmationDialogBoxProps = {
    heading: intl.formatMessage({
      id: 'CardDialog.delete-confirmation-dialog-heading',
      defaultMessage: 'Confirm card delete?'
    }),
    confirmButtonText: intl.formatMessage({
      id: 'CardDialog.delete-confirmation-dialog-button-text',
      defaultMessage: 'Delete'
    }),
    onConfirm: handleDeleteCard,
    onClose: () => {
      setShowConfirmationDialogBox(false);
    }
  };
  const deleteCard = () => {
    // user trying to delete a card with blank name
    // but content present cannot be deleted without
    // confirmation dialog
    if (card?.title === '' && card?.fields.contentOrder.length === 0) {
      handleDeleteCard();
      return;
    }
    setShowConfirmationDialogBox(true);
  };

  const duplicateCard = () => {
    if (space && cardPage) {
      mutator.duplicateCard({
        cardId: card.id,
        board,
        cardPage,
        afterRedo: async (newCardId) => {
          props.showCard(newCardId);
          mutate(`pages/${space.id}`);
        },
        beforeUndo: async () => {
          props.showCard(null);
        }
      });
    }
  };

  return (
    <>
      <Link href={fullPageUrl} draggable={false}>
        <StyledBox
          ref={props.readOnly ? () => null : cardRef}
          className={className}
          draggable={!props.readOnly}
          style={{ opacity: isDragging ? 0.5 : 1 }}
          onClick={(e) => {
            e.preventDefault();
            if (props.onClick) {
              props.onClick(e);
            }
          }}
          data-test={`kanban-card-${card.id}`}
        >
          {!props.readOnly && cardPage && (
            <PageActions
              page={cardPage}
              onClickDelete={pagePermissions.delete && cardPage.deletedAt === null ? deleteCard : undefined}
              onClickDuplicate={duplicateCard}
            />
          )}

          <div className='octo-icontitle'>
            <div>
              {cardPage?.icon ? (
                <PageIcon isEditorEmpty={!cardPage.hasContent} pageType='page' icon={cardPage.icon} />
              ) : undefined}
            </div>
            <div key='__title' className='octo-titletext'>
              {cardPage?.title || intl.formatMessage({ id: 'KanbanCard.untitled', defaultMessage: 'Untitled' })}
            </div>
          </div>
          {visiblePropertyTemplates.map((template) => (
            <Tooltip key={template.id} title={template.name}>
              <PropertyValueElement
                board={board}
                readOnly={true}
                card={card}
                updatedAt={cardPage?.updatedAt.toString() || ''}
                updatedBy={cardPage?.updatedBy || ''}
                propertyTemplate={template}
                showEmptyPlaceholder={false}
                displayType='kanban'
              />
            </Tooltip>
          ))}
          {linkedBounty && (
            <BountyFooter>
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.25
                }}
              >
                <CurrencyIcon>
                  {TokenLogoPaths[linkedBounty.rewardToken as CryptoCurrency] && (
                    <img loading='lazy' height={20} src={TokenLogoPaths[linkedBounty.rewardToken as CryptoCurrency]} />
                  )}
                </CurrencyIcon>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 0.25
                  }}
                >
                  <Box component='span'>{linkedBounty.rewardAmount}</Box>
                </Box>
              </Box>
              <BountyStatusChip status={linkedBounty.status} />
            </BountyFooter>
          )}
        </StyledBox>
      </Link>
      {showConfirmationDialogBox && <ConfirmationDialogBox dialogBox={confirmDialogProps} />}
    </>
  );
});

export default KanbanCard;
