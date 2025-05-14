import styled from '@emotion/styled';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Divider, MenuItem, MenuList, Stack, Switch, TextField, Typography } from '@mui/material';
import type { Board, IPropertyTemplate, RelationPropertyData } from '@packages/databases/board';
import { useAppSelector } from '@packages/databases/store/hooks';
import { useEffect, useState } from 'react';

import {
  useRemoveRelationProperty,
  useRenameRelationProperty,
  useSyncRelationProperty
} from 'charmClient/hooks/blocks';
import { Button } from 'components/common/Button';
import { PageIcon } from 'components/common/PageIcon';
import PopperPopup from 'components/common/PopperPopup';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { usePages } from 'hooks/usePages';

export const StyledMenuItem = styled(MenuItem)`
  padding: ${({ theme }) => theme.spacing(0, 1)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
`;

function RelationPropertyOptions({
  relationData,
  onChange,
  onRelatedToMenuClicked,
  disabled
}: {
  disabled?: boolean;
  onRelatedToMenuClicked?: VoidFunction;
  relationData: IPropertyTemplate['relationData'];
  onChange: (relationData: RelationPropertyData) => void;
}) {
  const { navigateToSpacePath } = useCharmRouter();
  const { pages } = usePages();
  const relatedBoardId = relationData?.boardId ?? null;
  if (!relatedBoardId) {
    return null;
  }
  const connectedBoard = pages[relatedBoardId];

  if (!connectedBoard || !relationData) {
    return null;
  }

  const connectedBoardComponent = (
    <>
      <PageIcon
        icon={connectedBoard.icon}
        isEditorEmpty={connectedBoard.hasContent === false}
        pageType={connectedBoard.type}
      />
      <Typography
        variant='subtitle1'
        color='secondary'
        m={0}
        component='div'
        maxWidth={80}
        textOverflow='ellipsis'
        overflow='hidden'
        whiteSpace='nowrap'
      >
        {connectedBoard.title ?? 'Untitled'}
      </Typography>
      <KeyboardArrowRightIcon color='secondary' fontSize='small' />
    </>
  );

  return (
    <>
      {onRelatedToMenuClicked && !disabled ? (
        <StyledMenuItem
          onClick={() => {
            onRelatedToMenuClicked();
          }}
        >
          <Typography mr={3}>Related to</Typography>
          <Stack
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            {connectedBoardComponent}
          </Stack>
        </StyledMenuItem>
      ) : (
        <Stack
          sx={{
            padding: '4px 8px',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'row'
          }}
        >
          <Typography color='secondary' mr={3}>
            Related to
          </Typography>
          <Stack
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => {
              navigateToSpacePath(`/${connectedBoard.path}`);
            }}
          >
            {connectedBoardComponent}
          </Stack>
        </Stack>
      )}
      <StyledMenuItem disabled={disabled}>
        <Typography mr={3}>Limit</Typography>
        <PopperPopup
          closeOnClick
          popupContent={
            <MenuList>
              <MenuItem
                selected={relationData.limit === 'single_page'}
                onClick={() => {
                  onChange({
                    ...relationData,
                    limit: 'single_page'
                  });
                }}
              >
                <Typography component='div'>1 page</Typography>
              </MenuItem>
              <MenuItem
                selected={relationData.limit === 'multiple_page'}
                onClick={() => {
                  onChange({
                    ...relationData,
                    limit: 'multiple_page'
                  });
                }}
              >
                No limit
              </MenuItem>
            </MenuList>
          }
        >
          <Stack
            sx={{
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <Typography variant='subtitle1' color='secondary' m={0} component='div'>
              {relationData.limit === 'single_page' ? '1 page' : 'No limit'}
            </Typography>
            <KeyboardArrowRightIcon color='secondary' fontSize='small' />
          </Stack>
        </PopperPopup>
      </StyledMenuItem>
      <StyledMenuItem
        disabled={disabled}
        onClick={() => {
          onChange({
            ...relationData,
            showOnRelatedBoard: !relationData.showOnRelatedBoard
          });
        }}
        data-test='show-on-related-board-button'
      >
        <Typography maxWidth={200} textOverflow='ellipsis' overflow='hidden' whiteSpace='nowrap' mr={3}>
          Show on {connectedBoard.title ?? 'Untitled'}
        </Typography>
        <Switch size='small' checked={relationData.showOnRelatedBoard} />
      </StyledMenuItem>
    </>
  );
}

export function RelationPropertyCreateOptions({
  setShowSelectDatabaseMenu,
  relationData,
  onChange,
  onButtonClick,
  disabled
}: {
  disabled?: boolean;
  relationData: IPropertyTemplate['relationData'];
  setShowSelectDatabaseMenu: (show: boolean) => void;
  onChange: (relationData?: IPropertyTemplate['relationData']) => void;
  onButtonClick: () => void;
}) {
  const { pages } = usePages();
  const connectedBoard = relationData ? pages[relationData.boardId] : null;

  if (!connectedBoard || !relationData) {
    return null;
  }

  return (
    <>
      <RelationPropertyOptions
        onChange={onChange}
        relationData={relationData}
        onRelatedToMenuClicked={() => {
          setShowSelectDatabaseMenu(true);
        }}
      />
      <Button
        onClick={onButtonClick}
        primary
        fullWidth
        disabled={disabled}
        sx={{
          mt: 1
        }}
        data-test='add-relation-button'
      >
        Add relation
      </Button>
    </>
  );
}

export function RelationPropertyEditOptions({
  relationData,
  onChange,
  propertyId,
  board
}: {
  relationData: RelationPropertyData;
  propertyId: string;
  onChange: (relationData: RelationPropertyData) => void;
  board: Board;
}) {
  const [relationDataTemp, setRelationDataTemp] = useState(relationData);
  const { trigger: syncRelationProperty, isMutating: isSyncingRelationProperty } = useSyncRelationProperty();
  const { trigger: renameRelationProperty, isMutating: isRenamingRelationProperty } = useRenameRelationProperty();
  const { trigger: removeRelationProperty, isMutating: isUnsyncingRelationProperty } = useRemoveRelationProperty();
  const { pages } = usePages();
  const connectedBoard = relationData ? pages[relationData.boardId] : null;
  const relatedBoard = useAppSelector((state) => state.boards.boards[relationData.boardId]);
  const relatedProperty = relatedBoard?.fields.cardProperties.find(
    (property) => property.id === relationData.relatedPropertyId
  );
  const boardPage = Object.values(pages).find((page) => page && page.boardId === board.id);

  const isMutating = isSyncingRelationProperty || isRenamingRelationProperty || isUnsyncingRelationProperty;

  const [relatedPropertyTitle, setRelatedPropertyTitle] = useState(
    relatedProperty?.name ?? `Related to ${boardPage?.title ?? 'Untitled'}`
  );

  const relatedPropertyUpdated =
    relationDataTemp?.showOnRelatedBoard !== relationData.showOnRelatedBoard ||
    (relatedProperty && relatedProperty?.name !== relatedPropertyTitle);

  useEffect(() => {
    setRelationDataTemp(relationData);
  }, [relationData]);

  if (!connectedBoard || !relationData || !boardPage) {
    return null;
  }

  return (
    <>
      <RelationPropertyOptions
        onChange={(newRelationData) => {
          setRelationDataTemp(newRelationData);
          if (newRelationData?.showOnRelatedBoard === relationData.showOnRelatedBoard) {
            onChange(newRelationData);
          }
        }}
        disabled={isMutating}
        relationData={relationDataTemp}
      />
      {(relatedProperty || relatedPropertyUpdated) && (
        <Stack my={1} gap={0.5}>
          <Divider />
          {relationDataTemp.showOnRelatedBoard && (
            <>
              <Typography variant='subtitle2'>Related property on {connectedBoard?.title || 'Untitled'}</Typography>
              <TextField
                value={relatedPropertyTitle}
                fullWidth
                disabled={isMutating}
                onChange={(e) => {
                  e.stopPropagation();
                  setRelatedPropertyTitle(e.target.value);
                }}
                placeholder={`Related to ${boardPage.title || 'Untitled'}`}
                autoFocus
              />
            </>
          )}
          {relatedPropertyUpdated && (
            <Button
              onClick={() => {
                const action =
                  relationDataTemp.showOnRelatedBoard !== relationData.showOnRelatedBoard
                    ? relationDataTemp.showOnRelatedBoard
                      ? 'sync'
                      : 'remove'
                    : relatedProperty && relatedPropertyTitle !== relatedProperty.name
                      ? 'rename'
                      : null;

                if (action === 'sync') {
                  syncRelationProperty({
                    boardId: board.id,
                    templateId: propertyId,
                    relatedPropertyTitle: relatedPropertyTitle || `Related to ${boardPage?.title ?? 'Untitled'}`
                  });
                } else if (action === 'rename') {
                  renameRelationProperty({
                    boardId: board.id,
                    templateId: propertyId,
                    relatedPropertyTitle
                  });
                } else if (action === 'remove') {
                  removeRelationProperty({
                    boardId: connectedBoard.id,
                    templateId: relationData.relatedPropertyId!,
                    removeBoth: false
                  });
                }
              }}
              variant='outlined'
              fullWidth
              disabled={isMutating || relatedPropertyTitle.length === 0}
              loading={isMutating}
              sx={{
                mt: 1
              }}
              disabledTooltip={
                relatedPropertyTitle.length === 0 ? `Please enter a name for the related property` : undefined
              }
            >
              {isMutating ? 'Updating relation' : 'Update relation'}
            </Button>
          )}
        </Stack>
      )}
    </>
  );
}
