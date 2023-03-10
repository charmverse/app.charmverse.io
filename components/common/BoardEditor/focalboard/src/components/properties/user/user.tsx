import styled from '@emotion/styled';
import { ClickAwayListener } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';

import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';

type Props = {
  memberIds: string[];
  readOnly: boolean;
  onChange: (memberIds: string[]) => void;
  showEmptyPlaceholder?: boolean;
};

const StyledUserPropertyContainer = styled(Box)`
  width: 100%;
  & .MuiInputBase-root,
  & input.MuiInputBase-input {
    background: inherit;
  }

  & .MuiAutocomplete-inputRoot.MuiInputBase-root.MuiOutlinedInput-root {
    padding: 4px;
  }

  & fieldset.MuiOutlinedInput-notchedOutline {
    border: none;
    outline: none;
  }

  & button.MuiButtonBase-root[title='Open'],
  & button.MuiButtonBase-root[title='Close'] {
    display: none;
  }
`;

function UserProperty(props: Props): JSX.Element | null {
  const [memberIds, setMemberIds] = useState(props.memberIds);
  return (
    <ClickAwayListener onClickAway={() => props.onChange(memberIds)}>
      <StyledUserPropertyContainer>
        <InputSearchMemberMultiple
          disableCloseOnSelect
          defaultValue={memberIds}
          onChange={(_memberIds) => {
            setMemberIds(_memberIds);
          }}
          readOnly={props.readOnly}
          placeholder={props.showEmptyPlaceholder && memberIds.length === 0 ? 'Empty' : ''}
        />
      </StyledUserPropertyContainer>
    </ClickAwayListener>
  );
}

export default UserProperty;
