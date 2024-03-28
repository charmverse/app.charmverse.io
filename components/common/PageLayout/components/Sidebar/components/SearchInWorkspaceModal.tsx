import { css } from '@emotion/react';
import styled from '@emotion/styled';
import SearchIcon from '@mui/icons-material/Search';
import { ListItem, ListItemText, ListItemIcon, MenuItem, Typography } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import Popper from '@mui/material/Popper';
import TextField from '@mui/material/TextField';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import type { SyntheticEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { useGetRecentHistory } from 'charmClient/hooks/pages';
import { Modal, DialogTitle, ModalPosition } from 'components/common/Modal';
import { PageIcon } from 'components/common/PageIcon';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { SearchResultItem } from 'hooks/useSearchPages';
import { useSearchPages } from 'hooks/useSearchPages';

const StyledAutocomplete = styled(Autocomplete<SearchResultItem, boolean | undefined, boolean>)`
  .MuiInput-root {
  }
  label: {
    transform: inherit;
  }
  .MuiAutocomplete-endAdornment {
    display: none;
  }
`;

const StyledPopper = styled(Popper)`
  position: initial !important;
  transform: initial !important;
  width: 100%;

  & > .MuiPaper-root {
    box-shadow: none;
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
  const { data: recentHistoryData } = useGetRecentHistory({ spaceId: isOpen ? space?.id : undefined });
  const { results } = useSearchPages({ search: searchString, limit: 50 });

  function onChange(event: SyntheticEvent<Element>, newInputValue: string) {
    setSearchString(newInputValue.trim()?.toLocaleLowerCase());
  }

  const recentHistory = useMemo(() => {
    return (
      recentHistoryData?.map((page) => ({
        id: page.id,
        path: page.path,
        title: page.title,
        breadcrumb: page.path,
        icon: page.icon,
        type: page.type
      })) || []
    );
  }, [recentHistoryData]);

  const options: SearchResultItem[] = searchString ? results : recentHistory;

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
        noOptionsText='No search results'
        autoComplete
        clearOnBlur={false}
        fullWidth
        onInputChange={onChange}
        onChange={(_e, item) => {
          if (item) {
            navigateToSpacePath((item as SearchResultItem).path);
            close();
          }
        }}
        getOptionLabel={(option) => (typeof option === 'object' ? option.title : option)}
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
                          color: part.highlight ? 'var(--primary-text)' : 'var(--secondary-text)'
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
              startAdornment: <SearchIcon color='secondary' sx={{ mx: 1 }} />,
              type: 'search',
              sx: { p: '8px !important', fontSize: '18px' }
            }}
            sx={{
              '& .MuiAutocomplete-clearIndicator': {
                color: '#000 !important'
              }
            }}
          />
        )}
      />
    </Modal>
  );
}
