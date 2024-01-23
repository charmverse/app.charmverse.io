import styled from '@emotion/styled';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
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
  buttonText = 'Add relation',
  relationData
}: {
  buttonText?: string;
  popupState: PopupState;
  onClick: (type: PropertyType, relationData?: IPropertyTemplate['relationData']) => void;
  relationData?: IPropertyTemplate['relationData'];
}) {
  const bindMenuProps = bindMenu(popupState);
  const { pages } = usePages();
  const [relationPropertyData, setRelationPropertyData] = useState<IPropertyTemplate['relationData'] | null>(
    relationData ?? null
  );
  const [showSelectDatabaseMenu, setShowSelectDatabaseMenu] = useState(true);
  const selectedPage = relationPropertyData ? pages[relationPropertyData.boardId] : null;

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
      ) : selectedPage && relationPropertyData ? (
        <Box minWidth={200} sx={{ px: 1 }}>
          <StyledMenuItem
            onClick={() => {
              setShowSelectDatabaseMenu(true);
            }}
          >
            <Typography mr={3}>Related to</Typography>
            <Stack
              sx={{
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <PageIcon isEditorEmpty={selectedPage.hasContent === false} pageType={selectedPage.type} />
              <Typography variant='subtitle1' color='secondary'>
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
                    selected={relationPropertyData.limit === 'single_page'}
                    onClick={() => {
                      setRelationPropertyData({
                        ...relationPropertyData,
                        limit: 'single_page'
                      });
                    }}
                  >
                    1 page
                  </MenuItem>
                  <MenuItem
                    selected={relationPropertyData.limit === 'multiple_page'}
                    onClick={() => {
                      setRelationPropertyData({
                        ...relationPropertyData,
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
                <Typography variant='subtitle1' color='secondary'>
                  {relationPropertyData.limit === 'single_page' ? '1 page' : 'No limit'}
                </Typography>
                <KeyboardArrowRightIcon color='secondary' fontSize='small' />
              </Stack>
            </PopperPopup>
          </StyledMenuItem>
          <StyledMenuItem
            onClick={() => {
              setRelationPropertyData({
                ...relationPropertyData,
                showOnRelatedBoard: !relationPropertyData.showOnRelatedBoard
              });
            }}
          >
            <Typography mr={3}>Show on {selectedPage.title ?? 'Untitled'}</Typography>
            <Switch size='small' checked={relationPropertyData.showOnRelatedBoard} />
          </StyledMenuItem>
          <Button
            onClick={() => {
              onClick('relation', relationPropertyData);
              onClose();
            }}
            primary
            fullWidth
            sx={{
              mt: 1
            }}
          >
            {buttonText}
          </Button>
        </Box>
      ) : null}
    </Menu>
  );
}
