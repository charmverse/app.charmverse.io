import { Autocomplete, Typography } from '@mui/material';

import { useGetSubtree } from 'charmClient/hooks/blocks';
import { isTruthy } from 'lib/utils/types';

import { RelationPageListItemsContainer } from '../properties/PagesAutocomplete';

type Props = {
  boardPageId: string;
  value: string[];
  onChange: (pageListItemIds: string[]) => void;
};

export function RelatedPagesSelect({ boardPageId, onChange, value }: Props) {
  const { blocks, isLoading } = useGetSubtree(boardPageId);

  return (
    <Autocomplete
      size='small'
      multiple
      value={value}
      onChange={(e, newValue) => onChange(newValue)}
      loading={isLoading}
      options={blocks.map((b) => b.id) || []}
      renderInput={(params) => {
        const pageIds = Array.isArray(params.inputProps.value) ? params.inputProps.value : [];
        return pageIds.length === 0 ? (
          <Typography color='secondary' fontSize='small'>
            Select a page
          </Typography>
        ) : (
          <RelationPageListItemsContainer
            pageListItems={pageIds
              .map((pageId) => {
                const pageListItem = blocks?.find((card) => card.id === pageId);
                return pageListItem;
              })
              .filter(isTruthy)}
          />
        );
      }}
    />
  );
}

/* {pageListItems.map((pageListItem) => {
        return (
          <MenuItem
            key={pageListItem.id}
            value={pageListItem.id}
            selected={!!filter.values.find((selectedPageListItemId) => selectedPageListItemId === pageListItem.id)}
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
      })}
    </Autocomplete> */
