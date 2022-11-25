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
import throttle from 'lodash/throttle';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { Modal, DialogTitle, ModalPosition } from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import log from 'lib/log';
import type { PageMeta } from 'lib/pages';
import { isTruthy } from 'lib/utilities/types';

enum ResultType {
  page = 'page',
  bounty = 'bounty'
}

type SearchResultItem = {
  name: string;
  link: string;
  type: ResultType;
  path? :string;
  id: string;
};

const StyledAutocomplete = styled(Autocomplete<SearchResultItem, boolean | undefined, boolean>)`
  .MuiInput-root {
    marginTop: 0px;
    paddingRight: 0px !important;
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

    &:hover, &.Mui-focused {
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

function SearchInWorkspaceModal (props: SearchInWorkspaceModalProps) {
  const { close, isOpen } = props;
  const router = useRouter();
  const { pages } = usePages();
  const space = useCurrentSpace();
  const [isSearching, setIsSearching] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<SearchResultItem[]>([]);

  const throttledSearch = throttle(getSearchResults, 200);

  useEffect(() => {

    if (!space) {
      return;
    }

    if (inputValue.replace(/\s/, '') === '') {
      setOptions([]);
      return undefined;
    }

    const allPages = Object.values(pages).filter(isTruthy);

    throttledSearch({
      query: inputValue,
      spaceId: space.id,
      spaceDomain: router.query.domain as string,
      allPages
    })
      ?.then((results) => {
        setOptions(results);
      })
      .catch(err => {
        log.error('Error searching for pages', err);
      });

    return () => {
      throttledSearch.cancel();
    };
  }, [!!space, inputValue]);

  return (
    <Modal
      open={isOpen}
      onClose={close}
      position={ModalPosition.top}
      style={{ height: '100%' }}
      size='large'
    >
      <DialogTitle onClose={close}>Quick Find</DialogTitle>
      <StyledAutocomplete
        options={options}
        noOptionsText='No search results'
        autoComplete
        clearOnBlur={false}
        fullWidth
        onInputChange={(_event, newInputValue) => {
          setIsSearching(!!newInputValue);
          setInputValue(newInputValue);
        }}
        onChange={(_e, item) => {
          if (item) {
            router.push((item as SearchResultItem).link);
          }
        }}
        getOptionLabel={option => typeof option === 'object' ? option.name : option}
        open={isSearching}
        disablePortal
        disableClearable
        // disable filtering when doing async search (see MUI docs)
        filterOptions={x => x}
        PopperComponent={StyledPopper}
        renderOption={(listItemProps, option: SearchResultItem, state) => {
          const matches = match(option.name, state.inputValue, { insideWords: true, findAllOccurrences: true });
          const parts = parse(option.name, matches);

          return (
            <StyledListItem {...listItemProps} key={option.id}>
              <Stack direction='row' spacing={1}>
                {
                    option.type === ResultType.page
                      ? <InsertDriveFileOutlinedIcon fontSize='small' style={{ marginTop: '2px' }} />
                      : <BountyIcon fontSize='small' style={{ marginTop: '2px' }} />
                  }
                <Stack>
                  <StyledTypographyPage>
                    {
                        parts.map((part: { text: string, highlight: boolean }) => {
                          return (
                            <span
                              key={`${part.text}${part.highlight}`}
                              style={{
                                fontWeight: part.highlight ? 700 : 400
                              }}
                            >{part.text}
                            </span>
                          );
                        })
                      }
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
            placeholder='Search inside the workspace'
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

function getSearchResults (params: { spaceDomain: string, spaceId: string, query: string, allPages: PageMeta[] }): Promise<SearchResultItem[]> {
  return charmClient.pages.searchPages(params.spaceId, params.query)
    .then(pages => pages.map(page => ({
      name: page.title || 'Untitled',
      path: getPagePath(page, params.allPages),
      link: `/${params.spaceDomain}/${page.path}`,
      type: ResultType.page,
      id: page.id
    }))
      .sort((item1, item2) => item1.name > item2.name ? 1 : -1));
}

function getPagePath (page: PageMeta, pageList: PageMeta[] = []): string {

  const pathElements: string[] = [];
  let currentPage: PageMeta | undefined = { ...page };

  while (currentPage && currentPage.parentId) {
    const pageId: string = currentPage.parentId;
    currentPage = pageList.find(p => p && p.id === pageId);
    if (currentPage) {
      pathElements.unshift(currentPage.title);
    }
  }

  return pathElements.join(' / ');
}

export default SearchInWorkspaceModal;
