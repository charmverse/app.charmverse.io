import styled from '@emotion/styled';
import { Box } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Modal, DialogTitle } from 'components/common/Modal';
import Link from 'components/common/Link';
import { useBounties } from 'hooks/useBounties';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';

const StyledLink = styled(Link)`
    padding-left: ${({ theme }) => theme.spacing(2)};
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
  }));

  const searchResultItems: SearchResultItem[] = [
    ...pageSearchResultItems,
    ...bountySearchResultItems
  ];

  return (
    <Modal
      open={isOpen}
      onClose={close}
    >
      <DialogTitle onClose={close}>Quick Find</DialogTitle>
      <Autocomplete
        freeSolo
        disableClearable
        options={searchResultItems}
        groupBy={(option) => option.group}
        getOptionLabel={option => typeof option === 'object' ? option.name : option}
        fullWidth
        sx={{
          '& .MuiInput-root': {
            marginTop: '0px'
          },
          '& label': {
            transform: 'inherit'
          }
        }}
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
