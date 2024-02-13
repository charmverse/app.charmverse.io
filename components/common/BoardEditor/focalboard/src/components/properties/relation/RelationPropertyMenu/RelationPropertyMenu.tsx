import styled from '@emotion/styled';
import { Box, Divider, Menu, MenuItem, TextField } from '@mui/material';
import { bindMenu } from 'material-ui-popup-state';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import { isTruthy } from 'lib/utilities/types';

import { LinkCharmVerseDatabase } from '../../../viewSidebar/viewSourceOptions/components/LinkCharmVerseDatabase';

import { RelationPropertyCreateOptions } from './RelationPropertyOptions';

export const StyledMenuItem = styled(MenuItem)`
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
  const { pages } = usePages();
  const { space } = useCurrentSpace();
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
          pages={[
            {
              hasContent: false,
              icon: '',
              id: `${space?.id}-proposalsBoard`,
              path: '',
              title: 'Proposals Board',
              type: 'board'
            },
            {
              hasContent: false,
              icon: '',
              id: `${space?.id}-rewardsBoard`,
              path: '',
              title: 'Rewards Board',
              type: 'board'
            },
            ...Object.values(pages).filter(isTruthy)
          ]}
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
