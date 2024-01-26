import styled from '@emotion/styled';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import type { SxProps } from '@mui/material';
import { Box, Menu, MenuItem, MenuList, Stack, Switch, Typography } from '@mui/material';
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
  onClick: (type: PropertyType, relationData?: IPropertyTemplate['relationData']) => void;
  relationData?: IPropertyTemplate['relationData'];
}) {
  const bindMenuProps = bindMenu(popupState);
  const [relationPropertyData, setRelationPropertyData] = useState<IPropertyTemplate['relationData'] | null>(
    relationData ?? null
  );
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
          onSelectLinkedDatabase={({ sourceDatabaseId }) => {
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
          <RelationPropertyOptions
            onChange={setRelationPropertyData}
            relationData={relationPropertyData}
            onButtonClick={() => {
              onClick('relation', relationPropertyData);
              onClose();
            }}
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
  onButtonClick
}: {
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
      {/* <StyledMenuItem
        onClick={() => {
          onChange({
            ...relationData,
            showOnRelatedBoard: !relationData.showOnRelatedBoard
          });
        }}
      >
        <Typography mr={3}>Show on {selectedPage.title ?? 'Untitled'}</Typography>
        <Switch size='small' checked={relationData.showOnRelatedBoard} />
      </StyledMenuItem> */}
      {onButtonClick && (
        <Button
          onClick={() => {
            onButtonClick();
          }}
          primary
          fullWidth
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
