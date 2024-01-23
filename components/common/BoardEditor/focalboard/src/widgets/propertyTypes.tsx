import styled from '@emotion/styled';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Divider, ListItemIcon, Menu, MenuItem, MenuList, Stack, Switch, Typography } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import { Button } from 'components/common/Button';
import { PageIcon } from 'components/common/PageIcon';
import PopperPopup from 'components/common/PopperPopup';
import { usePages } from 'hooks/usePages';
import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';

import { LinkCharmVerseDatabase } from '../components/viewSidebar/viewSourceOptions/components/LinkCharmVerseDatabase';

import { iconForPropertyType } from './iconForPropertyType';
import { typeDisplayName } from './typeDisplayName';

const propertyTypesList: PropertyType[] = [
  'text',
  'number',
  'email',
  'phone',
  'url',
  'select',
  'multiSelect',
  'date',
  'person',
  'checkbox',
  'relation',
  'createdTime',
  'createdBy',
  'updatedTime',
  'updatedBy'
];

const StyledMenuItem = styled(MenuItem)`
  padding: ${({ theme }) => theme.spacing(0, 1)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
`;

export function PropertyTypes({
  selectedTypes = [],
  onClick,
  isMobile
}: {
  selectedTypes?: PropertyType[];
  onClick: (type: PropertyType, relationData?: IPropertyTemplate['relationData']) => void;
  isMobile?: boolean;
}) {
  const addRelationPropertyPopupState = usePopupState({ variant: 'popover', popupId: 'add-relation-property' });
  const { pages } = usePages();
  const [relationPropertyData, setRelationPropertyData] = useState<IPropertyTemplate['relationData'] | null>(null);
  const selectedPage = relationPropertyData ? pages[relationPropertyData.boardId] : null;
  const bindMenuProps = bindMenu(addRelationPropertyPopupState);
  const bindTriggerProps = bindTrigger(addRelationPropertyPopupState);
  const [showSelectDatabaseMenu, setShowSelectDatabaseMenu] = useState(false);

  const bindTriggerClick = bindTriggerProps.onClick;
  bindTriggerProps.onClick = (...args) => {
    setShowSelectDatabaseMenu(true);
    bindTriggerClick(...args);
  };

  function onClose() {
    setShowSelectDatabaseMenu(false);
    setRelationPropertyData(null);
    bindMenuProps.onClose();
  }

  const intl = useIntl();
  return (
    <>
      <Stack gap={isMobile ? 0 : 0.5}>
        {!isMobile && (
          <>
            <Typography px={1} color='secondary' variant='subtitle1'>
              Select property type
            </Typography>
            <Divider />
          </>
        )}
        {propertyTypesList.map((type) => {
          return (
            <MenuItem
              selected={selectedTypes.includes(type)}
              data-test={`select-property-${type}`}
              key={type}
              {...(type === 'relation'
                ? bindTriggerProps
                : {
                    onClick: () => onClick(type)
                  })}
            >
              <ListItemIcon>{iconForPropertyType(type)}</ListItemIcon>
              <Typography>{typeDisplayName(intl, type)}</Typography>
            </MenuItem>
          );
        })}
      </Stack>
      <Menu {...bindMenuProps} onClose={onClose}>
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
              Add relation
            </Button>
          </Box>
        ) : null}
      </Menu>
    </>
  );
}
