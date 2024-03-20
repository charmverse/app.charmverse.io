import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Autocomplete,
  Box,
  IconButton,
  ListItemIcon,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import type { ReactNode } from 'react';
import React, { useCallback, useMemo, useState } from 'react';

import { PageIcon } from 'components/common/PageIcon';
import PageTitle from 'components/common/PageLayout/components/PageTitle';
import type { PageListItem } from 'components/common/PagesList';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { usePages } from 'hooks/usePages';
import type { IPropertyTemplate } from 'lib/databases/board';
import { isTruthy } from 'lib/utils/types';

import type { PropertyValueDisplayType } from '../../interfaces';

import { EmptyPlaceholder } from './EmptyPlaceholder';
import { PopupFieldWrapper } from './PopupFieldWrapper';
import { SelectPreviewContainer } from './TagSelect/TagSelect';
import { StyledUserPropertyContainer } from './UserAndRoleSelect';

const StyledAutocomplete = styled(Autocomplete<PageListItem & { selected: boolean }, true, boolean>)`
  min-width: 150px;
  .MuiAutocomplete-inputRoot {
    gap: 4px;
  }
`;

const renderDiv = (props: any & { children: ReactNode }) => <div>{props.children}</div>;

const StyledStack = styled(Stack)`
  flex-direction: row;
  align-items: center;
  overflow-x: hidden;
  cursor: pointer;
  gap: ${({ theme }) => theme.spacing(0.25)};
`;

const StyledRelatedPage = styled(Stack)`
  flex-direction: row;
  padding-left: ${({ theme }) => theme.spacing(0.5)};
  padding-right: ${({ theme }) => theme.spacing(0.5)};
  align-items: center;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.spacing(0.25)};
  transition: ${({ theme }) =>
    theme.transitions.create(['background-color', 'border-color', 'box-shadow'], {
      duration: theme.transitions.duration.shortest
    })};

  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
    transition: ${({ theme }) =>
      theme.transitions.create(['background-color', 'border-color', 'box-shadow'], {
        duration: theme.transitions.duration.shortest
      })};
  }
`;

export function RelationPageListItemsContainer({
  readOnly,
  pageListItems,
  onRemove,
  onClick
}: {
  readOnly?: boolean;
  pageListItems: PageListItem[];
  onRemove?: (id: string) => void;
  onClick?: (id: string) => void;
}) {
  return (
    <>
      {pageListItems.map((pageListItem) => {
        return (
          <StyledStack key={pageListItem.id} onClick={() => onClick?.(pageListItem.id)}>
            <PageIcon icon={pageListItem.icon} isEditorEmpty={!pageListItem.hasContent} pageType={pageListItem.type} />
            <PageTitle hasContent={!pageListItem.title} sx={{ fontWeight: 'bold' }}>
              {pageListItem.title || 'Untitled'}
            </PageTitle>

            {!readOnly && onRemove && (
              <IconButton sx={{ ml: 1 }} size='small' onClick={() => onRemove(pageListItem.id)}>
                <CloseIcon
                  sx={{
                    fontSize: 14
                  }}
                  cursor='pointer'
                  color='secondary'
                />
              </IconButton>
            )}
          </StyledStack>
        );
      })}
    </>
  );
}

function PagesAutocompleteBase({
  onChange,
  selectedPageListItems: _selectedPageListItems,
  pageListItems,
  readOnly,
  wrapColumn,
  displayType = 'details',
  emptyPlaceholderContent = 'Empty',
  showEmptyPlaceholder = true,
  variant = 'standard',
  relationTemplate,
  showCard
}: {
  relationTemplate: IPropertyTemplate;
  displayType?: PropertyValueDisplayType;
  readOnly?: boolean;
  pageListItems: PageListItem[];
  selectedPageListItems: PageListItem[];
  onChange: (pageListItemIds: string[]) => void;
  wrapColumn?: boolean;
  emptyPlaceholderContent?: string;
  showEmptyPlaceholder?: boolean;
  variant?: 'outlined' | 'standard';
  showCard?: (cardId: string | null) => void;
}) {
  const { navigateToSpacePath } = useCharmRouter();
  const selectionLimit = relationTemplate.relationData?.limit ?? 'single_page';
  const { pages } = usePages();
  const connectedBoard = relationTemplate.relationData?.boardId
    ? pages[relationTemplate.relationData.boardId]
    : undefined;
  const [isOpen, setIsOpen] = useState(false);

  const { sortedPages, selectedPageListItems } = useMemo(() => {
    const __selectedPageListItems = (
      selectionLimit === 'single_page' ? _selectedPageListItems.slice(0, 1) : _selectedPageListItems
    ).map((selectedPage) => ({ ...selectedPage, selected: true }));
    const selectedPageIds = __selectedPageListItems.map((v) => v.id);

    return {
      selectedPageListItems: __selectedPageListItems,
      sortedPages: pageListItems
        .filter(isTruthy)
        .map((pageA) => ({ ...pageA, selected: selectedPageIds.includes(pageA.id) }))
        .sort(
          (pageA, pageB) =>
            (pageB.selected ? 1 : 0) - (pageA.selected ? 1 : 0) ||
            ((pageA.title || 'Untitled') > (pageB.title || 'Untitled') ? 1 : -1)
        )
    };
  }, [pageListItems, _selectedPageListItems, selectionLimit]);

  const onClickToEdit = useCallback(() => {
    if (!readOnly) {
      setIsOpen(true);
    }
  }, [readOnly]);

  const popupField = displayType === 'table';

  const previewField = (
    <SelectPreviewContainer
      isHidden={popupField ? false : isOpen}
      displayType={displayType}
      readOnly={readOnly}
      onClick={onClickToEdit}
    >
      <Box display='inline-flex' flexWrap={wrapColumn ? 'wrap' : 'nowrap'} gap={1}>
        {selectedPageListItems.length === 0 ? (
          showEmptyPlaceholder && <EmptyPlaceholder>{emptyPlaceholderContent}</EmptyPlaceholder>
        ) : (
          <RelationPageListItemsContainer
            readOnly={readOnly}
            pageListItems={selectedPageListItems}
            // only showCard if its in readOnly mode since we need to open the select field in non readOnly mode
            onClick={readOnly ? showCard : undefined}
          />
        )}
      </Box>
    </SelectPreviewContainer>
  );

  const activeField = (
    <StyledUserPropertyContainer displayType='details'>
      <StyledAutocomplete
        PopperComponent={popupField ? renderDiv : undefined}
        PaperComponent={popupField ? renderDiv : undefined}
        disableClearable
        forcePopupIcon={false}
        fullWidth
        groupBy={(option) => (option.selected ? 'Linked page' : 'Link another page')}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        multiple
        noOptionsText='No pages found'
        onClose={() => setIsOpen(false)}
        openOnFocus
        options={sortedPages}
        renderInput={(params) => (
          <TextField
            {...params}
            autoFocus={variant === 'standard'}
            size='small'
            value={selectedPageListItems}
            placeholder='Link a page'
            InputProps={{
              ...params.InputProps,
              endAdornment: connectedBoard ? (
                <Stack flexDirection='row'>
                  <Typography variant='subtitle1' color='secondary' mr={0.5}>
                    In
                  </Typography>
                  <StyledRelatedPage
                    onClick={() => {
                      navigateToSpacePath(`/${connectedBoard.path}`);
                    }}
                  >
                    <PageIcon
                      size='small'
                      icon={connectedBoard.icon}
                      isEditorEmpty={!connectedBoard.hasContent}
                      pageType={connectedBoard.type}
                    />
                    <PageTitle
                      hasContent={!connectedBoard.title}
                      sx={{ fontWeight: 'bold', maxWidth: 250, flexGrow: 1 }}
                    >
                      {connectedBoard.title || 'Untitled'}
                    </PageTitle>
                  </StyledRelatedPage>
                </Stack>
              ) : null,
              ...(variant === 'standard' && { disableUnderline: true })
            }}
            variant={variant}
          />
        )}
        renderOption={(props, pageListItem) => {
          return (
            <MenuItem
              key={pageListItem.id}
              data-test={`page-option-${pageListItem.id}`}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                flexDirection: 'row'
              }}
              onClick={() => {
                if (!pageListItem.selected) {
                  if (selectionLimit === 'single_page') {
                    return onChange([pageListItem.id]);
                  } else {
                    return onChange([pageListItem, ...selectedPageListItems].map((v) => v.id));
                  }
                } else {
                  showCard?.(pageListItem.id);
                }
              }}
            >
              <Stack flexDirection='row' gap={0.5}>
                <ListItemIcon>
                  <PageIcon
                    icon={pageListItem.icon}
                    isEditorEmpty={!pageListItem.hasContent}
                    pageType={pageListItem.type}
                  />
                </ListItemIcon>
                <PageTitle hasContent={!pageListItem.title} sx={{ fontWeight: 'bold' }}>
                  {pageListItem.title || 'Untitled'}
                </PageTitle>
              </Stack>
              {pageListItem.selected ? (
                <Tooltip title='Unlink page'>
                  <RemoveIcon
                    fontSize='small'
                    color='secondary'
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(selectedPageListItems.filter((v) => v.id !== pageListItem.id).map((v) => v.id));
                    }}
                  />
                </Tooltip>
              ) : (
                <AddIcon fontSize='small' color='secondary' />
              )}
            </MenuItem>
          );
        }}
        renderTags={() => null}
        disabled={!!readOnly}
        value={selectedPageListItems}
      />
    </StyledUserPropertyContainer>
  );

  if (displayType === 'table') {
    return (
      <PopupFieldWrapper
        paperSx={{
          width: 500
        }}
        disabled={readOnly}
        previewField={previewField}
        activeField={activeField}
      />
    );
  }

  if (variant === 'standard' && !isOpen) {
    return previewField;
  }

  return activeField;
}

export const PagesAutocomplete = React.memo(PagesAutocompleteBase);
