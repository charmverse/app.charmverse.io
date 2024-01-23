import styled from '@emotion/styled';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Divider, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import { Constants } from 'lib/focalboard/constants';
import { getPropertyName } from 'lib/focalboard/getPropertyName';

import mutator from '../../mutator';

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

  return (
    <Stack p={2}>
      <TextField
        value={tempName}
        onClick={(e) => {
          e.stopPropagation();
        }}
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
      <StyledMenuItem onClick={toggleVisibility}>
        {isVisible ? <VisibilityOffOutlinedIcon fontSize='small' /> : <VisibilityOutlinedIcon fontSize='small' />}
        <Typography variant='body2'>{isVisible ? 'Hide in view' : 'Show in view'}</Typography>
      </StyledMenuItem>
      <StyledMenuItem onClick={duplicateProperty}>
        <ContentCopyOutlinedIcon fontSize='small' />
        <Typography variant='body2'>Duplicate</Typography>
      </StyledMenuItem>
      <StyledMenuItem onClick={deleteProperty}>
        <DeleteOutlinedIcon fontSize='small' />
        <Typography variant='body2'>Delete</Typography>
      </StyledMenuItem>
    </Stack>
  );
}

export { ViewPropertyOption };
