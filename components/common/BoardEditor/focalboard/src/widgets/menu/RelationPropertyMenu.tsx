import styled from '@emotion/styled';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Divider, Menu, MenuItem, MenuList, Stack, Switch, TextField, Typography } from '@mui/material';
import { bindMenu } from 'material-ui-popup-state';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';

import { useSyncRelationProperty } from 'charmClient/hooks/blocks';
import { Button } from 'components/common/Button';
import { PageIcon } from 'components/common/PageIcon';
import PopperPopup from 'components/common/PopperPopup';
import { usePages } from 'hooks/usePages';
import type { Board, IPropertyTemplate, PropertyType, RelationPropertyData } from 'lib/focalboard/board';

import { LinkCharmVerseDatabase } from '../../components/viewSidebar/viewSourceOptions/components/LinkCharmVerseDatabase';
import { useAppSelector } from '../../store/hooks';

const StyledMenuItem = styled(MenuItem)`
  padding: ${({ theme }) => theme.spacing(0, 1)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
`;

export function RelationPropertyMenu({
  onClick,
  popupState,
  relationData
}: {
  popupState: PopupState;
  onClick: (property: {
    type: PropertyType;
    relationData?: IPropertyTemplate['relationData'];
    name?: IPropertyTemplate['name'];
  }) => void;
  relationData?: IPropertyTemplate['relationData'];
}) {
  const bindMenuProps = bindMenu(popupState);
  const [relationPropertyData, setRelationPropertyData] = useState<IPropertyTemplate['relationData'] | null>(
    relationData ?? null
  );
  const [propertyTitle, setPropertyTitle] = useState('Relation' || '');
  const [showSelectDatabaseMenu, setShowSelectDatabaseMenu] = useState(true);

  function onClose() {
    bindMenuProps.onClose();
    // Wait for the menu to close before resetting the state
    setTimeout(() => {
      setShowSelectDatabaseMenu(false);
      setRelationPropertyData(null);
    }, 150);
  }

  return (
    <Menu
      {...bindMenuProps}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onClose={onClose}
    >
      {showSelectDatabaseMenu ? (
        <LinkCharmVerseDatabase
          placeholder='Link to a database'
          onSelectLinkedDatabase={({ sourceDatabaseId, pageTitle = 'Untitled' }) => {
            setRelationPropertyData(
              relationPropertyData
                ? {
                    ...relationPropertyData,
                    boardId: sourceDatabaseId
                  }
                : {
                    boardId: sourceDatabaseId,
                    limit: 'single_page',
                    relatedPropertyId: null,
                    showOnRelatedBoard: false
                  }
            );
            setPropertyTitle(`Related to ${pageTitle}`);
            setShowSelectDatabaseMenu(false);
          }}
        />
      ) : relationPropertyData ? (
        <Box
          sx={{
            minWidth: 200,
            px: 1
          }}
        >
          <TextField
            value={propertyTitle}
            onClick={(e) => {
              e.stopPropagation();
            }}
            fullWidth
            onChange={(e) => {
              e.stopPropagation();
              setPropertyTitle(e.target.value);
            }}
            autoFocus
          />
          <Divider
            sx={{
              my: 1
            }}
          />
          <RelationPropertyCreateOptions
            onChange={setRelationPropertyData}
            relationData={relationPropertyData}
            onButtonClick={() => {
              onClick({
                type: 'relation',
                relationData: relationPropertyData,
                name: propertyTitle
              });
              onClose();
            }}
            disabled={propertyTitle.length === 0}
            setShowSelectDatabaseMenu={setShowSelectDatabaseMenu}
          />
        </Box>
      ) : null}
    </Menu>
  );
}

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
  const selectedPage = relationData ? pages[relationData.boardId] : null;

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
  const { trigger: syncRelationProperty, isMutating } = useSyncRelationProperty();
  const { pages } = usePages();
  const selectedPage = relationData ? pages[relationData.boardId] : null;
  const relatedBoard = useAppSelector((state) => state.boards.boards[relationData.boardId]);
  const relatedProperty = relatedBoard?.fields.cardProperties.find(
    (property) => property.id === relationData.relatedPropertyId
  );

  const [relatedPropertyTitle, setRelatedPropertyTitle] = useState(
    relatedProperty?.name ?? `Related to ${board.title || 'Untitled'}`
  );

  const relatedPropertyUpdated =
    relationDataTemp?.showOnRelatedBoard !== relationData.showOnRelatedBoard ||
    relatedProperty?.name !== relatedPropertyTitle;

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
                syncRelationProperty({
                  boardId: board.id,
                  action:
                    relatedProperty && relatedPropertyTitle !== relatedProperty.name
                      ? 'rename'
                      : relationDataTemp.showOnRelatedBoard
                      ? 'create'
                      : 'delete',
                  templateId: propertyId,
                  relatedPropertyTitle: relatedPropertyTitle || `Related to ${board.title ?? 'Untitled'}`
                });
              }}
              variant='outlined'
              fullWidth
              loading={isMutating}
              sx={{
                mt: 1
              }}
            >
              {isMutating ? 'Updating relation' : 'Update relation'}
            </Button>
          )}
        </Stack>
      )}
    </>
  );
}
