import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import { Autocomplete, Box, IconButton, ListItemIcon, MenuItem, Stack, TextField } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';

import { PageIcon } from 'components/common/PageIcon';
import PageTitle from 'components/common/PageLayout/components/PageTitle';
import type { PageListItem } from 'components/common/PagesList';
import type { RelationPropertyData } from 'lib/focalboard/board';
import { isTruthy } from 'lib/utilities/types';

import type { PropertyValueDisplayType } from '../../interfaces';

import { EmptyPlaceholder } from './EmptyPlaceholder';
import { SelectPreviewContainer } from './TagSelect/TagSelect';
import { StyledUserPropertyContainer } from './UserAndRoleSelect';

const StyledAutocomplete = styled(Autocomplete<PageListItem, true, boolean>)`
  min-width: 150px;
  .MuiAutocomplete-inputRoot {
    gap: 4px;
  }
`;

function PageListItemsContainer({
  readOnly,
  pageListItems,
  wrapColumn,
  onRemove
}: {
  readOnly?: boolean;
  wrapColumn?: boolean;
  pageListItems: PageListItem[];
  onRemove?: (id: string) => void;
}) {
  return (
    <>
      {pageListItems.map((pageListItem) => {
        return (
          <Stack
            key={pageListItem.id}
            gap={0.5}
            flexDirection='row'
            alignItems='center'
            sx={wrapColumn ? { overflowX: 'hidden' } : { overflowX: 'hidden' }}
          >
            <PageIcon icon={pageListItem.icon} isEditorEmpty={!pageListItem.hasContent} pageType={pageListItem.type} />
            <PageTitle hasContent={!pageListItem.title} sx={{ fontWeight: 'bold' }}>
              {pageListItem.title ? pageListItem.title : 'Untitled'}
            </PageTitle>

            {!readOnly && onRemove && (
              <IconButton size='small' onClick={() => onRemove(pageListItem.id)}>
                <CloseIcon
                  sx={{
                    fontSize: 14
                  }}
                  cursor='pointer'
                  color='secondary'
                />
              </IconButton>
            )}
          </Stack>
        );
      })}
    </>
  );
}

export function RelationPropertyPagesAutocomplete({
  onChange,
  selectedPageListItems: _selectedPageListItems,
  pageListItems,
  readOnly,
  wrapColumn,
  displayType = 'details',
  emptyPlaceholderContent = 'Empty',
  showEmptyPlaceholder = true,
  relationLimit
}: {
  relationLimit: RelationPropertyData['limit'];
  displayType?: PropertyValueDisplayType;
  readOnly?: boolean;
  pageListItems: PageListItem[];
  selectedPageListItems: PageListItem[];
  onChange: (pageListItemIds: string[]) => void;
  wrapColumn?: boolean;
  emptyPlaceholderContent?: string;
  showEmptyPlaceholder?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const selectedPageListItems =
    relationLimit === 'single_page' ? _selectedPageListItems.slice(0, 1) : _selectedPageListItems;
  const sortedPages = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return pageListItems
      .filter((p) => p?.title?.toLowerCase().includes(lowerCaseSearchTerm))
      .filter(isTruthy)
      .sort((pageA, pageB) => ((pageA.title || 'Untitled') > (pageB.title || 'Untitled') ? 1 : -1));
  }, [pageListItems, searchTerm]);

  const onClickToEdit = useCallback(() => {
    if (!readOnly) {
      setIsOpen(true);
    }
  }, [readOnly]);

  function removeOption(idToRemove: string) {
    onChange(selectedPageListItems.filter(({ id }) => id !== idToRemove).map(({ id }) => id));
  }

  if (!isOpen) {
    return (
      <SelectPreviewContainer isHidden={isOpen} displayType={displayType} readOnly={readOnly} onClick={onClickToEdit}>
        <Box display='inline-flex' flexWrap={wrapColumn ? 'wrap' : 'nowrap'} gap={0.5}>
          {selectedPageListItems.length === 0 ? (
            showEmptyPlaceholder && <EmptyPlaceholder>{emptyPlaceholderContent}</EmptyPlaceholder>
          ) : (
            <PageListItemsContainer readOnly={readOnly} wrapColumn={wrapColumn} pageListItems={selectedPageListItems} />
          )}
        </Box>
      </SelectPreviewContainer>
    );
  }

  return (
    <StyledUserPropertyContainer displayType='details'>
      <StyledAutocomplete
        autoHighlight
        disableClearable
        disableCloseOnSelect
        filterSelectedOptions
        forcePopupIcon={false}
        fullWidth
        getOptionLabel={(option) => {
          return option.title || 'Untitled';
        }}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        multiple
        noOptionsText='No pages found'
        onChange={(_, _pageListItems) => {
          if (relationLimit === 'single_page') {
            const selectedPageItem = _pageListItems[1] ?? _pageListItems[0];
            if (selectedPageItem) {
              _pageListItems = [selectedPageItem];
            }
          }
          return onChange(_pageListItems.map((v) => v.id) ?? []);
        }}
        onClose={() => setIsOpen(false)}
        openOnFocus
        options={sortedPages}
        renderInput={(params) => (
          <TextField
            {...params}
            autoFocus
            size='small'
            value={selectedPageListItems}
            placeholder={selectedPageListItems.length === 0 ? 'Link a page' : ''}
            InputProps={{
              ...params.InputProps,
              onChange: (e) => {
                setSearchTerm(e.target.value);
              },
              disableUnderline: true
            }}
            variant='standard'
          />
        )}
        renderOption={(props, pageListItem) => {
          return (
            <MenuItem
              key={pageListItem.id}
              selected={
                !!selectedPageListItems.find((selectedPageListItem) => selectedPageListItem.id === pageListItem.id)
              }
              {...props}
            >
              <ListItemIcon>
                <PageIcon
                  icon={pageListItem.icon}
                  isEditorEmpty={!pageListItem.hasContent}
                  pageType={pageListItem.type}
                />
              </ListItemIcon>
              <PageTitle hasContent={!pageListItem.title} sx={{ fontWeight: 'bold' }}>
                {pageListItem.title ? pageListItem.title : 'Untitled'}
              </PageTitle>
            </MenuItem>
          );
        }}
        renderTags={(_pageListItems) => (
          <PageListItemsContainer
            readOnly={readOnly}
            onRemove={removeOption}
            wrapColumn={wrapColumn}
            pageListItems={_pageListItems}
          />
        )}
        disabled={!!readOnly}
        value={selectedPageListItems}
      />
    </StyledUserPropertyContainer>
  );
}
