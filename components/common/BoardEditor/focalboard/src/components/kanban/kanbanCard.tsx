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
import { PageIcon } from 'components/common/PageLayout/components/PageIcon';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';

import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import { Utils } from '../../utils';
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
  // eslint-disable-next-line
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
  const [isDragging, isOver, cardRef] = useSortable('card', card, !props.readOnly, props.onDrop);
  const visiblePropertyTemplates = props.visiblePropertyTemplates || [];
  let className = props.isSelected ? 'KanbanCard selected' : 'KanbanCard';
  if (props.isManualSort && isOver) {
    className += ' dragover';
  }
  const space = useCurrentSpace();

  const { bounties } = useBounties();
  const linkedBounty = bounties.find((bounty) => bounty.page?.id === card.id);

  const { pages } = usePages();
  const cardPage = pages[card.id];
  const router = useRouter();
  const domain = router.query.domain || /^\/share\/(.*)\//.exec(router.asPath)?.[1];
  const fullPageUrl = `/${domain}/${cardPage?.path}`;

  const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false);
  const handleDeleteCard = async () => {
    if (!card) {
      Utils.assertFailure();
      return;
    }
    await mutator.deleteBlock(card, 'delete card');
    mutate(`pages/${space?.id}`);
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
          {!props.readOnly && cardPage && <PageActions page={cardPage} onClickDelete={deleteCard} />}

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
            <PropertyValueElement
              key={template.id}
              board={board}
              readOnly={true}
              card={card}
              updatedAt={cardPage?.updatedAt.toString() || ''}
              updatedBy={cardPage?.updatedBy || ''}
              propertyTemplate={template}
              showEmptyPlaceholder={false}
              displayType='kanban'
              showTooltip
            />
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
