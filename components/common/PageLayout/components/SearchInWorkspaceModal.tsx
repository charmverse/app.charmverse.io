import styled from '@emotion/styled';
import { Box } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Modal, DialogTitle } from 'components/common/Modal';
import Popper from '@mui/material/Popper';
import Link from 'components/common/Link';
import { useBounties } from 'hooks/useBounties';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';

const StyledPopper = styled(Popper)`
  position: initial !important;
  transform: initial !important;
  width: 100%;

  & > .MuiPaper-root {
    box-shadow: none;

    & > .MuiAutocomplete-listbox {
      max-height: initial;
    }
  }
`;

const StyledLink = styled(Link)`
    padding-left: ${({ theme }) => theme.spacing(3)};
    padding-right: ${({ theme }) => theme.spacing(2)};
    align-items: center;
    color: ${({ theme }) => theme.palette.secondary.main};
    display: flex;
    font-size: 14px;
    font-weight: 500;
    padding-top: 4px;
    padding-bottom: 4px;
    :hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
    color: inherit;
    }
`;

type SearchResultItem = {
    name: string;
    link: string;
    group: string;
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

  const pageSearchResultItems: SearchResultItem[] = Object.values(pages)
    .map(page => ({
      name: page!.title,
      link: `/${router.query.domain}/${page!.path}`,
      group: 'Pages'
    })).sort((page1, page2) => page1.name > page2.name ? 1 : -1);

  const bountySearchResultItems: SearchResultItem[] = bounties.map(bounty => ({
    name: bounty.title,
    link: `/${router.query.domain}/bounties/${bounty.id}`,
    group: 'Bounties'
  })).sort((bounty1, bounty2) => bounty1.name > bounty2.name ? 1 : -1);

  const searchResultItems: SearchResultItem[] = [
    ...pageSearchResultItems,
    ...bountySearchResultItems
  ];

  return (
    <Modal
      open={isOpen}
      onClose={close}
      style={{ height: '100%' }}
      size='large'
    >
      <DialogTitle onClose={close}>Quick Find</DialogTitle>
      <Autocomplete
        freeSolo
        disableClearable
        options={searchResultItems}
        groupBy={(option) => option.group}
        getOptionLabel={option => typeof option === 'object' ? option.name : option}
        open={true}
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
              {option.name}
            </StyledLink>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder='Search inside the workspace'
            variant='standard'
            size='small'
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
