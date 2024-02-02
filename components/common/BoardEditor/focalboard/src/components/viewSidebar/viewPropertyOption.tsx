import styled from '@emotion/styled';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Divider, MenuItem, Typography, Stack, TextField } from '@mui/material';
import { useMemo, useState } from 'react';

import { proposalPropertyTypesList, type Board, type IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import { Constants } from 'lib/focalboard/constants';
import { getPropertyName } from 'lib/focalboard/getPropertyName';
import { defaultRewardPropertyIds } from 'lib/rewards/blocks/constants';

import mutator from '../../mutator';
import { RelationPropertyOptions } from '../../widgets/menu/RelationPropertyMenu';
import { DEFAULT_BLOCK_IDS } from '../table/tableHeader';

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
  const name = getPropertyName(property);
  const [tempName, setTempName] = useState(name || '');
  const { visiblePropertyIds } = view.fields;
  const titlePropertyIndex = visiblePropertyIds.indexOf(Constants.titleColumnId);
  const visiblePropertyIdsWithTitle = useMemo(
    () => (titlePropertyIndex === -1 ? [Constants.titleColumnId, ...visiblePropertyIds] : visiblePropertyIds),
    [titlePropertyIndex, visiblePropertyIds]
  );
  const isVisible = visiblePropertyIdsWithTitle.includes(property.id);

  const disabled =
    proposalPropertyTypesList.includes(property.type as any) ||
    DEFAULT_BLOCK_IDS.includes(property.id) ||
    defaultRewardPropertyIds.includes(property.id) ||
    !!property.formFieldId ||
    !!property.proposalFieldId;

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
          if (e.code === 'Enter' && tempName.length !== 0 && tempName !== name) {
            mutator.changePropertyTypeAndName(board, cards, property, property.type, tempName, views);
          }
        }}
      />
      <Divider
        sx={{
          mt: 2
        }}
      />
      {property.type === 'relation' && (
        <>
          <RelationPropertyOptions
            onChange={(relationData) => {
              mutator.updateProperty(board, property.id, {
                ...property,
                relationData
              });
            }}
            relationData={property.relationData}
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
    </Stack>
  );
}

export { ViewPropertyOption };
