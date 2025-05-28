import { styled } from '@mui/material';
import { Box } from '@mui/material';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { useTrashPages } from 'charmClient/hooks/pages';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import { KanbanPageActionsMenuButton } from 'components/common/PageActions/KanbanPageActionButton';
import { PageIcon } from 'components/common/PageIcon';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Board, IPropertyTemplate } from '@packages/databases/board';
import type { Card } from '@packages/databases/card';
import { Constants } from '@packages/databases/constants';
import { isTouchScreen } from '@packages/lib/utils/browser';

import { useSortable } from '../../hooks/sortable';
import PropertyValueElement from '../propertyValueElement';

const StyledBox = styled(Box)`
  ${hoverIconsStyle({ absolutePositioning: true })}
`;

type Props = {
  board: Board;
  card: Card;
  onClick: (e: React.MouseEvent, card: Card) => void;
  visiblePropertyTemplates: IPropertyTemplate[];
  visibleTitle: boolean;
  isSelected: boolean;
  readOnly: boolean;
  onDrop: (srcCard: Card, dstCard: Card) => void;
};

const GalleryCard = React.memo((props: Props) => {
  const { card, board } = props;
  const { trigger: trashPages } = useTrashPages();
  const { showError } = useSnackbar();
  const [isDragging, isOver, cardRef] = useSortable('card', card, !props.readOnly && !isTouchScreen(), props.onDrop);

  const visiblePropertyTemplates = (props.visiblePropertyTemplates || []).filter(
    (property) => property.id !== Constants.titleColumnId
  );

  let className = props.isSelected ? 'GalleryCard selected' : 'GalleryCard';
  if (isOver) {
    className += ' dragover';
  }

  const galleryImageUrl = card.galleryImage;

  const deleteCard = async () => {
    try {
      await trashPages({ pageIds: [card.id], trash: true });
    } catch (error) {
      showError(error);
    }
  };

  return card ? (
    <StyledBox
      className={className}
      onClick={(e: React.MouseEvent) => props.onClick(e, card)}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      ref={cardRef}
      data-test={`gallery-card-${card.id}`}
    >
      {!props.readOnly && <KanbanPageActionsMenuButton page={card} onClickDelete={deleteCard} />}
      {galleryImageUrl && (
        <div className='gallery-image'>
          <img className='ImageElement' src={galleryImageUrl} alt='Gallery item' />
        </div>
      )}
      {props.visibleTitle && (
        <div className='gallery-title'>
          {card.icon ? <PageIcon isEditorEmpty={!card.hasContent} pageType='card' icon={card.icon} /> : undefined}
          <div key='__title'>
            {card.title || <FormattedMessage id='KanbanCard.untitled' defaultMessage='Untitled' />}
          </div>
        </div>
      )}
      {visiblePropertyTemplates.length > 0 && (
        <div className='gallery-props'>
          {visiblePropertyTemplates.map((template) => (
            <PropertyValueElement
              key={template.id}
              updatedAt={card.updatedAt.toString() || ''}
              updatedBy={card.updatedBy || ''}
              board={board}
              readOnly
              card={card}
              propertyTemplate={template}
              showEmptyPlaceholder={false}
              showTooltip
              displayType='gallery'
            />
          ))}
        </div>
      )}
    </StyledBox>
  ) : null;
});

export default GalleryCard;
