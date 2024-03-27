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
import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import { Modal, DialogTitle, ModalPosition } from 'components/common/Modal';
import { PageIcon } from 'components/common/PageIcon';
import { useCharmRouter } from 'hooks/useCharmRouter';
import type { SearchResultItem } from 'hooks/useSearchPages';
import { useSearchPages } from 'hooks/useSearchPages';

enum ResultType {
  page = 'page',
  bounty = 'bounty'
}

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

export function SearchInWorkspaceModal(props: SearchInWorkspaceModalProps) {
  const { close, isOpen } = props;
  const { navigateToSpacePath } = useCharmRouter();
  const [expandPageList, setExpandPageList] = useState(false);
  const [searchString, setSearchString] = useState('');
  const { results: options } = useSearchPages({ search: searchString, limit: 50 });

  function onChange(event: SyntheticEvent<Element>, newInputValue: string) {
    if (newInputValue.trim() === '') {
      setExpandPageList(false);
      setSearchString(newInputValue);
    } else {
      setExpandPageList(true);
      setSearchString(newInputValue);
    }
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
            navigateToSpacePath((item as SearchResultItem).path);
            close();
          }
        }}
        getOptionLabel={(option) => (typeof option === 'object' ? option.title : option)}
        open={expandPageList}
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
              <Stack direction='row' spacing={1}>
                <PageIcon icon={option.icon} isEditorEmpty={false} pageType={option.type} />
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
                  {option.breadcrumb && <StyledTypographyPath>{option.breadcrumb}</StyledTypographyPath>}
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
