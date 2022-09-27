import { useState } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, Typography } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { Modal, DialogTitle, ModalPosition } from 'components/common/Modal';
import Popper from '@mui/material/Popper';
import { useBounties } from 'hooks/useBounties';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';
import type { IPageWithPermissions } from 'lib/pages';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';

const StyledPopper = styled(Popper)`
  position: initial !important;
  transform: initial !important;
  width: 100%;

  & > .MuiPaper-root {
    box-shadow: none;
  }
`;

const StyledBox = styled(Box)`
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

enum ResultType {
  page = 'page',
  bounty = 'bounty'
}

type SearchResultItem = {
    name: string;
    link: string;
    type: ResultType;
    path? :string;
  };

type SearchInWorkspaceModalProps = {
    close: () => void,
    isOpen: boolean,
};

function SearchInWorkspaceModal (props: SearchInWorkspaceModalProps) {
  const { close, isOpen } = props;
  const router = useRouter();
  const { pages } = usePages();
  const { bounties } = useBounties();
  const [isSearching, setIsSearching] = useState(false);

  const pageList = Object.values(pages);

  const getPagePath = (page: IPageWithPermissions) => {
    if (!pages) return '';

    const pathElements: string[] = [];
    let currentPage: IPageWithPermissions | undefined = { ...page };

    while (currentPage && currentPage.parentId) {
      const pageId: string = currentPage.parentId;
      currentPage = pageList.find(p => p && p.id === pageId);
      if (currentPage) {
        pathElements.unshift(currentPage.title);
      }
    }

    return pathElements.join(' / ');
  };

  const pageSearchResultItems: SearchResultItem[] = pageList
    .map(page => ({
      name: page?.title || 'Untitled',
      path: getPagePath(page!),
      link: `/${router.query.domain}/${page!.path}`,
      type: ResultType.page
    }));

  const bountySearchResultItems: SearchResultItem[] = bounties.map(bounty => ({
    name: bounty.page?.title || '',
    link: `/${router.query.domain}/${bounty.page?.id}`,
    type: ResultType.bounty
  }));

  const searchResultItems: SearchResultItem[] = [
    ...pageSearchResultItems,
    ...bountySearchResultItems
  ].sort((item1, item2) => item1.name > item2.name ? 1 : -1);

  return (
    <Modal
      open={isOpen}
      onClose={close}
      position={ModalPosition.top}
      style={{ height: '100%' }}
      size='large'
    >
      <DialogTitle onClose={close}>Quick Find</DialogTitle>
      <Autocomplete
        options={searchResultItems}
        noOptionsText='No search results'
        autoComplete
        clearOnBlur={false}
        fullWidth
        onInputChange={(_event, newInputValue) => {
          setIsSearching(!!newInputValue);
        }}
        onChange={(e, item) => {
          e.preventDefault();
          router.push(item.link);
        }}
        getOptionLabel={option => typeof option === 'object' ? option.name : option}
        open={isSearching}
        disablePortal
        disableClearable
        sx={{
          '& .MuiInput-root': {
            marginTop: '0px',
            paddingRight: '0px !important'
          },
          '& label': {
            transform: 'inherit'
          },
          '& .MuiAutocomplete-endAdornment': {
            display: 'none'
          }
        }}
        PopperComponent={StyledPopper}
        renderOption={(listItemProps, option: SearchResultItem, { inputValue }) => {
          const matches = match(option.name, inputValue, { insideWords: true, findAllOccurrences: true });
          const parts = parse(option.name, matches);

          return (
            <li {...listItemProps}>
              <StyledBox>
                <Stack direction='row' spacing={1}>
                  {
                    option.type === ResultType.page
                      ? <InsertDriveFileOutlinedIcon fontSize='small' style={{ marginTop: '2px' }} />
                      : <BountyIcon fontSize='small' style={{ marginTop: '2px' }} />
                  }
                  <Stack>
                    <StyledTypographyPage>
                      {
                        parts.map((part: { text: string; highlight: boolean; }) => {
                          return (
                            <span
                              key={part.text}
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
              </StyledBox>
            </li>
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

export default SearchInWorkspaceModal;
