import type { PageType } from '@charmverse/core/prisma-client';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Divider, MenuItem, MenuList, Stack, Switch, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import {
  useRemoveRelationProperty,
  useRenameRelationProperty,
  useSyncRelationProperty
} from 'charmClient/hooks/blocks';
import { Button } from 'components/common/Button';
import { PageIcon } from 'components/common/PageIcon';
import PopperPopup from 'components/common/PopperPopup';
import { usePages } from 'hooks/usePages';
import type { Board, IPropertyTemplate, RelationPropertyData } from 'lib/focalboard/board';

import { useAppSelector } from '../../../../store/hooks';

import { StyledMenuItem } from './RelationPropertyMenu';

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
  const { pages } = usePages();

  const selectedPage = useMemo(() => {
    const relatedBoardId = relationData?.boardId ?? null;
    if (!relatedBoardId) {
      return null;
    }
    const _selectedPage = pages[relatedBoardId];
    if (_selectedPage) {
      return {
        title: _selectedPage.title,
        icon: _selectedPage.icon,
        type: _selectedPage.type,
        hasContent: _selectedPage.hasContent,
        id: _selectedPage.id,
        path: _selectedPage.path
      };
    }

    const isProposalsBoard = relatedBoardId.endsWith('-proposalsBoard');

    if (isProposalsBoard) {
      return {
        title: 'Proposals Board',
        icon: '',
        type: 'board' as PageType,
        hasContent: false,
        id: relatedBoardId,
        path: ''
      };
    }

    const isRewardsBoard = relatedBoardId.endsWith('-rewardsBoard');

    if (isRewardsBoard) {
      return {
        title: 'Rewards Board',
        icon: '',
        type: 'board' as PageType,
        hasContent: false,
        id: relatedBoardId,
        path: ''
      };
    }

    return null;
  }, [relationData, pages]);

  if (!selectedPage || !relationData) {
    return null;
  }

  return (
    <>
      <StyledMenuItem
        onClick={() => {
          onRelatedToMenuClicked?.();
        }}
        disabled={!onRelatedToMenuClicked || disabled}
      >
        <Typography color={onRelatedToMenuClicked ? '' : 'secondary'} mr={3}>
          Related to
        </Typography>
        <Stack flexDirection='row' alignItems='center'>
          <PageIcon
            icon={selectedPage.icon}
            isEditorEmpty={selectedPage.hasContent === false}
            pageType={selectedPage.type}
          />
          <Typography variant='subtitle1' color='secondary' m={0} component='div'>
            {selectedPage.title ?? 'Untitled'}
          </Typography>
          <KeyboardArrowRightIcon color='secondary' fontSize='small' />
        </Stack>
      </StyledMenuItem>
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
        <Typography mr={3}>Show on {selectedPage.title ?? 'Untitled'}</Typography>
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
  const selectedPage = relationData ? pages[relationData.boardId] : null;

  if (!selectedPage || !relationData) {
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
  const selectedPage = relationData ? pages[relationData.boardId] : null;
  const relatedBoard = useAppSelector((state) => state.boards.boards[relationData.boardId]);
  const relatedProperty = relatedBoard?.fields.cardProperties.find(
    (property) => property.id === relationData.relatedPropertyId
  );

  const isMutating = isSyncingRelationProperty || isRenamingRelationProperty || isUnsyncingRelationProperty;

  const [relatedPropertyTitle, setRelatedPropertyTitle] = useState(
    relatedProperty?.name ?? `Related to ${board.title || 'Untitled'}`
  );

  const relatedPropertyUpdated =
    relationDataTemp?.showOnRelatedBoard !== relationData.showOnRelatedBoard ||
    (relatedProperty && relatedProperty?.name !== relatedPropertyTitle);

  useEffect(() => {
    setRelationDataTemp(relationData);
  }, [relationData]);

  if (!selectedPage || !relationData) {
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
              <Typography variant='subtitle2'>Related property on {selectedPage?.title || 'Untitled'}</Typography>
              <TextField
                value={relatedPropertyTitle}
                fullWidth
                disabled={isMutating}
                onChange={(e) => {
                  e.stopPropagation();
                  setRelatedPropertyTitle(e.target.value);
                }}
                placeholder={`Related to ${board.title || 'Untitled'}`}
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
                    relatedPropertyTitle: relatedPropertyTitle || `Related to ${board.title ?? 'Untitled'}`
                  });
                } else if (action === 'rename') {
                  renameRelationProperty({
                    boardId: board.id,
                    templateId: propertyId,
                    relatedPropertyTitle
                  });
                } else if (action === 'remove') {
                  removeRelationProperty({
                    boardId: board.id,
                    templateId: propertyId,
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
