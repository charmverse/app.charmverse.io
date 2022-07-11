import { useState } from 'react';
import styled from '@emotion/styled';
import { Box, Typography } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { Modal, DialogTitle } from 'components/common/Modal';
import Popper from '@mui/material/Popper';
import Link from 'components/common/Link';
import { useBounties } from 'hooks/useBounties';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';
import { IPageWithPermissions } from 'lib/pages';

const StyledPopper = styled(Popper)`
  position: initial !important;
  transform: initial !important;
  width: 100%;

  & > .MuiPaper-root {
    box-shadow: none;
  }
`;

const StyledLink = styled(Link)`
    padding-left: 0px;
    padding-right: ${({ theme }) => theme.spacing(2)};
    align-items: center;
    color: ${({ theme }) => theme.palette.secondary.main};
    display: flex;
    gap: 5px;
    font-size: 17px;
    font-weight: 500;
    padding-top: 4px;
    padding-bottom: 4px;
    :hover {
      background-color: ${({ theme }) => theme.palette.action.hover};
      color: inherit;
    }
`;

const StyledTypography = styled(Typography)`
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
      currentPage = pageList.find(p => p.id === pageId);
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
    name: bounty.title,
    link: `/${router.query.domain}/bounties/${bounty.id}`,
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
      style={{ height: '100%' }}
      size='large'
    >
      <DialogTitle onClose={close}>Quick Find</DialogTitle>
      <Autocomplete
        disableClearable
        options={searchResultItems}
        noOptionsText='No search results'
        onInputChange={(_event, newInputValue) => {
          setIsSearching(!!newInputValue);
        }}
        getOptionLabel={option => typeof option === 'object' ? option.name : option}
        open={isSearching}
        disablePortal={true}
        fullWidth
        sx={{
          '& .MuiInput-root': {
            marginTop: '0px'
          },
          '& label': {
            transform: 'inherit'
          }
        }}
        PopperComponent={StyledPopper}
        renderOption={(_, option: SearchResultItem) => (
          <Box p={0.5}>
            <StyledLink
              href={option.link}
            >
              {
                option.type === ResultType.page
                  ? <InsertDriveFileOutlinedIcon fontSize='small' />
                  : <BountyIcon fontSize='small' />
              }
              {option.name}{option.path && <StyledTypography>- {option.path}</StyledTypography>}
            </StyledLink>
          </Box>
        )}
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
          />
        )}
      />
    </Modal>
  );
}

export default SearchInWorkspaceModal;
