import styled from '@emotion/styled';
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
  const [isOpen, setIsOpen] = useState(false);
  return (
    <StyledUserPropertyContainer onClick={() => setIsOpen(true)}>
      <InputSearchMemberMultiple
        open={isOpen}
        disableCloseOnSelect
        defaultValue={memberIds}
        onChange={(_memberIds, reason) => {
          if (reason === 'removeOption' && !isOpen) {
            props.onChange(_memberIds);
          }
          setMemberIds(_memberIds);
        }}
        onClose={() => {
          props.onChange(memberIds);
          setIsOpen(false);
        }}
        readOnly={props.readOnly}
        placeholder={props.showEmptyPlaceholder && memberIds.length === 0 ? 'Empty' : ''}
      />
    </StyledUserPropertyContainer>
  );
}

export default UserProperty;
