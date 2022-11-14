import styled from '@emotion/styled';
import DuplicateIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, IconButton, ListItemText, MenuItem } from '@mui/material';
import type { MouseEvent } from 'react';
import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { mutate } from 'swr';

import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import { PageActions } from 'components/common/PageActions';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { isTouchScreen } from 'lib/utilities/browser';

import type { Board, IPropertyTemplate } from '../../blocks/board';
import type { Card } from '../../blocks/card';
import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import Tooltip from '../../widgets/tooltip';
import PropertyValueElement from '../propertyValueElement';

const StyledBox = styled(Box)`
  ${({ theme }) => hoverIconsStyle({ theme, isTouchScreen: isTouchScreen() })}
`;

type Props = {
  board: Board;
  card: Card;
  onClick: (e: React.MouseEvent, card: Card) => void;
  visiblePropertyTemplates: IPropertyTemplate[];
  visibleTitle: boolean;
  isSelected: boolean;
  readOnly: boolean;
  isManualSort: boolean;
  onDrop: (srcCard: Card, dstCard: Card) => void;
}

const GalleryCard = React.memo((props: Props) => {
  const { card, board } = props;
  const { pages, getPagePermissions } = usePages();
  const space = useCurrentSpace();
  const [isDragging, isOver, cardRef] = useSortable('card', card, props.isManualSort && !props.readOnly && !isTouchScreen(), props.onDrop);
  const cardPage = pages[card.id];
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const visiblePropertyTemplates = props.visiblePropertyTemplates || [];

  let className = props.isSelected ? 'GalleryCard selected' : 'GalleryCard';
  if (isOver) {
    className += ' dragover';
  }

  const galleryImageUrl: null | string | undefined = cardPage?.headerImage || cardPage?.galleryImage;

  const pagePermissions = getPagePermissions(card.id);

  return (
    cardPage ? (
      <StyledBox
        className={className}
        onClick={(e: React.MouseEvent) => props.onClick(e, card)}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        ref={cardRef}
      >
        {!props.readOnly
        && (
          <>
            <IconButton
              size='small'
              className='icons'
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                p: 1,
                m: 1
              }}
              onClick={handleClick}
            >
              <MoreHorizIcon color='secondary' fontSize='small' />
            </IconButton>
            <PageActions
              anchorEl={anchorEl}
              onClick={handleClose}
              open={open}
              pageType='card'
              pageCreatedBy={cardPage.createdBy}
              pageUpdatedAt={cardPage.updatedAt}
              pageId={cardPage.id}
            >
              {pagePermissions.delete && cardPage.deletedAt === null && (
                <MenuItem
                  dense
                  onClick={() => mutator.deleteBlock(card, 'delete card')}
                >
                  <DeleteOutlineIcon fontSize='small' sx={{ mr: 1 }} />
                  <ListItemText>Delete card</ListItemText>
                </MenuItem>
              )}
              <MenuItem
                dense
                onClick={() => {
                  if (space) {
                    mutator.duplicateCard({
                      cardId: card.id,
                      board,
                      cardPage,
                      afterRedo: async () => {
                        mutate(`pages/${space.id}`);
                      }
                    });
                  }
                }}
              >
                <DuplicateIcon fontSize='small' sx={{ mr: 1 }} />
                <ListItemText>Duplicate</ListItemText>
              </MenuItem>
            </PageActions>
          </>
        )}
        {galleryImageUrl
        && (
          <div className='gallery-image'>
            <img
              className='ImageElement'
              src={galleryImageUrl}
              alt='Gallery item'
            />
          </div>
        )}
        {!galleryImageUrl
          && <div className='gallery-item' />}
        {props.visibleTitle
        && (
          <div className='gallery-title'>
            {cardPage?.icon ? <PageIcon isEditorEmpty={!cardPage?.hasContent} pageType='card' icon={cardPage.icon} /> : undefined}
            <div key='__title'>
              {cardPage?.title
              || (
                <FormattedMessage
                  id='KanbanCard.untitled'
                  defaultMessage='Untitled'
                />
              )}
            </div>
          </div>
        )}
        {visiblePropertyTemplates.length > 0
        && (
          <div className='gallery-props'>
            {visiblePropertyTemplates.map((template) => (
              <Tooltip
                key={template.id}
                title={template.name}
                placement='top'
              >
                <PropertyValueElement
                  updatedAt={cardPage?.updatedAt.toString() || ''}
                  updatedBy={cardPage?.updatedBy || ''}
                  board={board}
                  readOnly={true}
                  card={card}
                  propertyTemplate={template}
                  showEmptyPlaceholder={false}
                />
              </Tooltip>
            ))}
          </div>
        )}
      </StyledBox>
    ) : null
  );
});

export default GalleryCard;

