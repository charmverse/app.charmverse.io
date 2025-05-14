import styled from '@emotion/styled';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Divider, MenuItem, Typography, Stack, TextField } from '@mui/material';
import type { Board, IPropertyTemplate } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';
import { Constants } from '@packages/databases/constants';
import mutator from '@packages/databases/mutator';
import { isReturnKey } from '@packages/lib/utils/react';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useMemo, useState } from 'react';

import { DeleteRelationPropertyModal } from '../properties/relation/DeleteRelationPropertyModal';
import { RelationPropertyEditOptions } from '../properties/relation/RelationPropertyMenu/RelationPropertyOptions';

const StyledMenuItem = styled(MenuItem)`
  padding-left: ${({ theme }) => theme.spacing(1)};
  padding-right: ${({ theme }) => theme.spacing(1)};
  gap: ${({ theme }) => theme.spacing(1)};
  flex-direction: row;
  align-items: center;
`;

function ViewPropertyOption({
  property,
  board,
  cards,
  views,
  view,
  goBackStep
}: {
  property: IPropertyTemplate;
  cards: Card[];
  board: Board;
  views: BoardView[];
  view: BoardView;
  goBackStep: VoidFunction;
}) {
  const name = property.name;
  const [tempName, setTempName] = useState(name || '');
  const { visiblePropertyIds } = view.fields;
  const titlePropertyIndex = visiblePropertyIds.indexOf(Constants.titleColumnId);
  const visiblePropertyIdsWithTitle = useMemo(
    () => (titlePropertyIndex === -1 ? [Constants.titleColumnId, ...visiblePropertyIds] : visiblePropertyIds),
    [titlePropertyIndex, visiblePropertyIds]
  );
  const isVisible = visiblePropertyIdsWithTitle.includes(property.id);
  const showRelationPropertyDeletePopup = usePopupState({ variant: 'popover', popupId: 'delete-relation-property' });

  const disabled = !!property.readOnly;

  const toggleVisibility = () => {
    let newVisiblePropertyIds = [];
    if (isVisible) {
      newVisiblePropertyIds = visiblePropertyIdsWithTitle.filter((o: string) => o !== property.id);
    } else {
      newVisiblePropertyIds = [...visiblePropertyIdsWithTitle, property.id];
    }
    mutator.changeViewVisibleProperties(view.id, visiblePropertyIdsWithTitle, newVisiblePropertyIds);
  };

  const deleteProperty = () => {
    if (property.type === 'relation' && property.relationData?.showOnRelatedBoard) {
      showRelationPropertyDeletePopup.open();
      return;
    }
    mutator.deleteProperty(board, views, cards, property.id);
    goBackStep();
  };

  const duplicateProperty = () => {
    mutator.duplicatePropertyTemplate(board, view, property.id);
  };

  const isTitleProperty = property.id === Constants.titleColumnId;

  return (
    <Stack p={2}>
      <TextField
        value={tempName}
        onClick={(e) => {
          e.stopPropagation();
        }}
        disabled={disabled}
        onChange={(e) => {
          e.stopPropagation();
          setTempName(e.target.value);
        }}
        autoFocus
        onKeyDown={(e) => {
          e.stopPropagation();
          if (isReturnKey(e) && tempName.length !== 0 && tempName !== name) {
            mutator.changePropertyTypeAndName(board, cards, property, property.type, tempName, views);
          }
        }}
      />
      <Divider
        sx={{
          mt: 2
        }}
      />
      {property.type === 'relation' && property.relationData && (
        <>
          <RelationPropertyEditOptions
            onChange={(relationData) => {
              mutator.updateProperty(board, property.id, {
                ...property,
                relationData
              });
            }}
            propertyId={property.id}
            relationData={property.relationData}
            board={board}
          />
          <Divider sx={{ mt: 1 }} />
        </>
      )}
      <StyledMenuItem disabled={disabled || isTitleProperty} onClick={toggleVisibility}>
        {isVisible ? <VisibilityOffOutlinedIcon fontSize='small' /> : <VisibilityOutlinedIcon fontSize='small' />}
        <Typography variant='body2'>{isVisible ? 'Hide in view' : 'Show in view'}</Typography>
      </StyledMenuItem>
      <StyledMenuItem
        disabled={disabled || isTitleProperty || property.type === 'relation'}
        onClick={duplicateProperty}
      >
        <ContentCopyOutlinedIcon fontSize='small' />
        <Typography variant='body2'>Duplicate</Typography>
      </StyledMenuItem>
      <StyledMenuItem disabled={disabled || isTitleProperty} onClick={deleteProperty}>
        <DeleteOutlinedIcon fontSize='small' />
        <Typography variant='body2'>Delete</Typography>
      </StyledMenuItem>
      {showRelationPropertyDeletePopup.isOpen && (
        <DeleteRelationPropertyModal
          board={board}
          template={property}
          onClose={showRelationPropertyDeletePopup.close}
        />
      )}
    </Stack>
  );
}

export { ViewPropertyOption };
