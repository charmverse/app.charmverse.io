import styled from '@emotion/styled';
import { Box } from '@mui/system';
import { useState } from 'react';

import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';
import UserDisplay from 'components/common/UserDisplay';
import type { Member } from 'lib/members/interfaces';

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
    padding: 2px;
  }

  & fieldset.MuiOutlinedInput-notchedOutline {
    border: none;
    outline: none;
  }

  & button.MuiButtonBase-root[title='Open'],
  & button.MuiButtonBase-root[title='Close'] {
    display: none;
  }

  & .MuiAutocomplete-tag {
    margin: 2px;
  }
`;

function arrayEquals<T>(a: T[], b: T[]) {
  return a.length === b.length && a.every((val, index) => val === b[index]);
}

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
          // Reduce less flicker in the ui
          if (!arrayEquals(memberIds, props.memberIds)) {
            props.onChange(memberIds);
          }
          setIsOpen(false);
        }}
        getOptionLabel={(user) => (<UserDisplay avatarSize='xSmall' user={user as Member} />) as any}
        readOnly={props.readOnly}
        placeholder={props.showEmptyPlaceholder && memberIds.length === 0 ? 'Empty' : ''}
      />
    </StyledUserPropertyContainer>
  );
}

export default UserProperty;
