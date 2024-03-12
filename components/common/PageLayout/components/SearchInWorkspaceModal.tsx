import { log } from '@charmverse/core/log';
import type { PageMeta } from '@charmverse/core/pages';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import { ListItem, Typography } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { useRouter } from 'next/router';
import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import charmClient from 'charmClient';
import { Modal, DialogTitle, ModalPosition } from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import debouncePromise from 'lib/utils/debouncePromise';

enum ResultType {
  page = 'page',
  bounty = 'bounty'
}

type SearchResultItem = {
  name: string;
  link: string;
  type: ResultType;
  path?: string;
  id: string;
};
// eslint-disable-next-line
const StyledAutocomplete = styled(Autocomplete<SearchResultItem, boolean | undefined, boolean>)`
  .MuiInput-root {
    margintop: 0px;
    paddingright: 0px !important;
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
    padding-left: 0px;
    padding-right: ${({ theme }) => theme.spacing(2)};
    flex-direction: column;
    align-items: start;
    color: ${({ theme }) => theme.palette.secondary.main};
    display: flex;
    gap: 5px;
    font-size: 17px;
    font-weight: 400;
    padding-top: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid ${({ theme }) => theme.palette.gray.main};

    &:hover,
    &.Mui-focused {
      color: inherit;
    }
  }
`;

const baseLine = css`
  max-width: 450px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const StyledTypographyPage = styled(Typography)`
  ${baseLine}
`;

const StyledTypographyPath = styled(Typography)`
  ${baseLine}
  font-style: italic;
`;

type SearchInWorkspaceModalProps = {
  close: () => void;
  isOpen: boolean;
};

const debouncedSearch = debouncePromise(getSearchResults, 200);

export function SearchInWorkspaceModal(props: SearchInWorkspaceModalProps) {
  const { close, isOpen } = props;
  const router = useRouter();
  const { pages } = usePages();
  const { space } = useCurrentSpace();
  const [expandPageList, setExpandPageList] = useState(false);
  const [options, setOptions] = useState<SearchResultItem[]>([]);

  function onChange(event: SyntheticEvent<Element>, newInputValue: string) {
    if (!space) {
      setExpandPageList(false);
      return;
    }

    if (newInputValue.trim() === '') {
      setOptions([]);
      setExpandPageList(false);
      return;
    }

    setExpandPageList(true);
    debouncedSearch({
      query: newInputValue,
      spaceId: space.id,
      spaceDomain: router.query.domain as string,
      pages
    })
      .then((results) => {
        if (results) {
          setOptions(results);
        }
      })
      .catch((err) => {
        log.error('Error searching for pages', err);
      });
  }

  return (
    <Modal open={isOpen} onClose={close} position={ModalPosition.top} style={{ height: '100%' }} size='large'>
      <DialogTitle onClose={close}>Quick Find</DialogTitle>
      <StyledAutocomplete
        options={options}
        noOptionsText='No search results'
        autoComplete
        clearOnBlur={false}
        fullWidth
        onInputChange={onChange}
        onChange={(_e, item) => {
          if (item) {
            router.push((item as SearchResultItem).link);
            close();
          }
        }}
        getOptionLabel={(option) => (typeof option === 'object' ? option.name : option)}
        open={expandPageList}
        disablePortal
        disableClearable
        // disable filtering when doing async search (see MUI docs)
        filterOptions={(x) => x}
        PopperComponent={StyledPopper}
        renderOption={(listItemProps, option: SearchResultItem, state) => {
          const matches = match(option.name, state.inputValue, { insideWords: true });
          const parts = parse(option.name, matches);

          return (
            <StyledListItem {...listItemProps} key={option.id}>
              <Stack direction='row' spacing={1}>
                {option.type === ResultType.page ? (
                  <InsertDriveFileOutlinedIcon fontSize='small' style={{ marginTop: '2px' }} />
                ) : (
                  <BountyIcon fontSize='small' style={{ marginTop: '2px' }} />
                )}
                <Stack>
                  <StyledTypographyPage>
                    {parts.map((part: { text: string; highlight: boolean }) => {
                      return (
                        <span
                          key={`${option.id}-${part.text}${part.highlight}`}
                          style={{
                            fontWeight: part.highlight ? 700 : 400
                          }}
                        >
                          {part.text}
                        </span>
                      );
                    })}
                  </StyledTypographyPage>
                  {option.path && <StyledTypographyPath>{option.path}</StyledTypographyPath>}
                </Stack>
              </Stack>
            </StyledListItem>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder='Search inside the space'
            variant='standard'
            size='small'
            autoFocus={true}
            InputProps={{
              ...params.InputProps,
              type: 'search'
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

function getSearchResults(params: {
  spaceDomain: string;
  spaceId: string;
  query: string;
  pages: Record<string, PageMeta | undefined>;
}): Promise<SearchResultItem[]> {
  return charmClient.pages.searchPages(params.spaceId, params.query, 50).then((pages) => {
    return pages.map((page) => ({
      name: page.title || 'Untitled',
      path: getPagePath(page, params.pages),
      link: `/${params.spaceDomain}/${page.path}`,
      type: ResultType.page,
      id: page.id
    }));
  });
}

function getPagePath(
  page: PageMeta,
  pages: { [id: string]: { parentId?: string | null; title: string } | undefined }
): string {
  const pathElements: string[] = [];
  let currentPage: { parentId?: string | null; title: string } | undefined = { ...page };

  while (currentPage && currentPage.parentId) {
    const pageId: string = currentPage.parentId;
    currentPage = pages[pageId];
    if (currentPage) {
      pathElements.unshift(currentPage.title || 'Untitled');
    }
  }

  return pathElements.join(' / ');
}
