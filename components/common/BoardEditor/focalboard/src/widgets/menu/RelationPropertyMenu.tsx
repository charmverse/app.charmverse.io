import styled from '@emotion/styled';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Divider, Menu, MenuItem, MenuList, Stack, TextField, Typography } from '@mui/material';
import { bindMenu } from 'material-ui-popup-state';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { PageIcon } from 'components/common/PageIcon';
import PopperPopup from 'components/common/PopperPopup';
import { usePages } from 'hooks/usePages';
import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';

import { LinkCharmVerseDatabase } from '../../components/viewSidebar/viewSourceOptions/components/LinkCharmVerseDatabase';

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
            onChange={(e) => {
              e.stopPropagation();
              setPropertyTitle(e.target.value);
            }}
            autoFocus
          />
          <Divider
            sx={{
              mt: 2
            }}
          />
          <RelationPropertyOptions
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

export function RelationPropertyOptions({
  setShowSelectDatabaseMenu,
  relationData,
  onChange,
  onButtonClick,
  disabled
}: {
  disabled?: boolean;
  relationData: IPropertyTemplate['relationData'];
  setShowSelectDatabaseMenu?: (show: boolean) => void;
  onChange: (relationData?: IPropertyTemplate['relationData']) => void;
  onButtonClick?: () => void;
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
          setShowSelectDatabaseMenu?.(true);
        }}
        disabled={!setShowSelectDatabaseMenu}
      >
        <Typography color={setShowSelectDatabaseMenu ? '' : 'secondary'} mr={3}>
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
      <StyledMenuItem>
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
      {onButtonClick && (
        <Button
          onClick={() => {
            onButtonClick();
          }}
          primary
          fullWidth
          disabled={disabled}
          sx={{
            mt: 1
          }}
        >
          Add relation
        </Button>
      )}
    </>
  );
}
