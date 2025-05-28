import { css } from '@emotion/react';
import { styled } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { ListItem, ListItemText, ListItemIcon, Typography } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import Popper from '@mui/material/Popper';
import TextField from '@mui/material/TextField';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import type { SyntheticEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { useGetRecentHistory } from 'charmClient/hooks/pages';
import LoadingComponent from 'components/common/LoadingComponent';
import { Modal, ModalPosition } from 'components/common/Modal';
import { PageIcon } from 'components/common/PageIcon';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import type { SearchResultItem } from 'hooks/useSearchPages';
import { useSearchPages, getBreadcrumb } from 'hooks/useSearchPages';
import { getRelativeDateInThePast } from '@packages/lib/utils/dates';

const StyledAutocomplete = styled(Autocomplete<SearchResultItem, boolean | undefined, boolean>)`
  .MuiInput-root {
    border-bottom: 1px solid var(--input-border);
  }
  label: {
    transform: inherit;
  }
  .MuiAutocomplete-endAdornment {
    display: none;
  }
  & .MuiAutocomplete-clearIndicator {
    color: '#000 !important';
  }
`;

const StyledPopper = styled(Popper)`
  position: initial !important;
  transform: initial !important;
  width: 100%;

  & > .MuiPaper-root {
    box-shadow: none;
  }
  // group label
  & .MuiListSubheader-root {
    line-height: 2em;
  }
  // the container of each group
  .MuiAutocomplete-groupUl {
    margin-bottom: 16px;
  }
  & .MuiAutocomplete-listbox {
    padding-left: 3px;
    padding-right: 3px;
  }
`;

const StyledListItem = styled(ListItem)`
  &.MuiAutocomplete-option {
    &:hover,
    &.Mui-focused {
      color: inherit;
    }
  }
`;

const StyledTypographyPage = styled(Typography)`
  font-size: 14px;
  max-width: 450px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const StyledTypographyPath = styled(Typography)`
  color: var(--secondary-text);
  display: inline;
  font-size: 0.8em;
  &::before {
    content: ' — ';
  }
`;

type SearchInWorkspaceModalProps = {
  close: () => void;
  isOpen: boolean;
};

export function SearchInWorkspaceModal(props: SearchInWorkspaceModalProps) {
  const { close, isOpen } = props;
  const { navigateToSpacePath } = useCharmRouter();
  const [searchString, setSearchString] = useState('');
  const { space } = useCurrentSpace();
  const { pages } = usePages();
  const { data: recentHistoryData, isLoading: isLoadingHistory } = useGetRecentHistory({
    spaceId: isOpen ? space?.id : undefined
  });
  const { results, isLoading: isLoadingSearch } = useSearchPages({ search: searchString, limit: 50 });

  const showLoading = isLoadingHistory || (isLoadingSearch && results.length === 0);

  function onChange(event: SyntheticEvent<Element>, newInputValue: string) {
    setSearchString(newInputValue.trim()?.toLocaleLowerCase());
  }

  const recentHistory: SearchResultItem[] = useMemo(() => {
    return (
      recentHistoryData?.map((page) => ({
        id: page.id,
        path: page.path,
        title: page.title || 'Untitled',
        group: getRelativeDateInThePast(page.lastViewedAt),
        breadcrumb: getBreadcrumb(page, pages),
        icon: page.icon,
        type: page.type
      })) || []
    );
  }, [recentHistoryData]);

  const options: SearchResultItem[] = searchString ? results : recentHistory;
  // group history by date
  const groupBy = searchString ? undefined : (option: SearchResultItem) => option.group || '';

  useEffect(() => {
    if (!isOpen) {
      // clear results when modal clsoes
      setSearchString('');
    }
  }, [isOpen]);

  return (
    <Modal noPadding open={isOpen} onClose={close} position={ModalPosition.top} style={{ height: '100%' }} size='large'>
      <StyledAutocomplete
        options={options}
        loading={showLoading}
        noOptionsText='No search results'
        autoComplete
        clearOnBlur={false}
        fullWidth
        onInputChange={onChange}
        onChange={(_e, item) => {
          if (item) {
            navigateToSpacePath(`/${(item as SearchResultItem).path}`);
            close();
          }
        }}
        getOptionLabel={(option) => (typeof option === 'object' ? option.title : option)}
        groupBy={groupBy}
        open
        disablePortal
        disableClearable
        // disable filtering when doing async search (see MUI docs)
        filterOptions={(x) => x}
        PopperComponent={StyledPopper}
        renderOption={(listItemProps, option: SearchResultItem, state) => {
          const matches = match(option.title, state.inputValue, { insideWords: true });
          const parts = parse(option.title, matches);

          return (
            <StyledListItem {...listItemProps} key={option.id}>
              <ListItemIcon>
                <PageIcon icon={option.icon} isEditorEmpty={false} pageType={option.type} />
              </ListItemIcon>
              <ListItemText>
                <StyledTypographyPage>
                  {parts.map((part: { text: string; highlight: boolean }) => {
                    return (
                      <span
                        key={`${option.id}-${part.text}${part.highlight}`}
                        style={{
                          fontWeight: 600,
                          backgroundColor: part.highlight ? 'var(--bg-yellow)' : 'transparent'
                        }}
                      >
                        {part.text}
                      </span>
                    );
                  })}
                  {option.breadcrumb && <StyledTypographyPath>{option.breadcrumb}</StyledTypographyPath>}
                </StyledTypographyPage>
              </ListItemText>
            </StyledListItem>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={`Search ${space?.name || ''}...`}
            variant='standard'
            autoFocus={true}
            InputProps={{
              ...params.InputProps,
              disableUnderline: true,
              startAdornment: <SearchIcon color='secondary' sx={{ mx: 1 }} />,
              type: 'search',
              sx: { p: '8px !important', fontSize: '18px' }
            }}
          />
        )}
      />
    </Modal>
  );
}
