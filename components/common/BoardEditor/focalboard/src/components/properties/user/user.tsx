import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';
import { Box, Stack } from '@mui/system';
import { useEffect, useState } from 'react';

import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';
import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';

type Props = {
  memberIds: string[];
  readOnly: boolean;
  onChange: (memberIds: string[]) => void;
  showEmptyPlaceholder?: boolean;
};

const StyledUserPropertyContainer = styled(Box)`
  width: 100%;
  height: 100%;
  overflow: hidden;
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
  const [clicked, setClicked] = useState(false);
  const { members } = useMembers();

  useEffect(() => {
    setMemberIds(props.memberIds);
  }, [props.memberIds]);

  const membersRecord = members.reduce<Record<string, Member>>((cur, member) => {
    cur[member.id] = member;
    return cur;
  }, {});

  const [isOpen, setIsOpen] = useState(false);
  return (
    <StyledUserPropertyContainer
      onClick={() => {
        // Only register click if display type is details or table
        if (!props.readOnly) {
          setIsOpen(true);
          setClicked(true);
        }
      }}
    >
      <InputSearchMemberMultiple
        open={isOpen}
        disableCloseOnSelect
        defaultValue={memberIds}
        value={memberIds.map((memberId) => membersRecord[memberId])}
        onChange={(_memberIds, reason) => {
          if (reason === 'removeOption' && !isOpen) {
            props.onChange(_memberIds);
          }
          setMemberIds(_memberIds);
        }}
        onClose={() => {
          if (isOpen) {
            // Reduce flicker in the ui
            if (!arrayEquals(memberIds, props.memberIds)) {
              props.onChange(memberIds);
            }
            setIsOpen(false);
            setClicked(false);
          }
        }}
        getOptionLabel={(user) => (typeof user === 'string' ? user : user?.username)}
        readOnly={props.readOnly}
        placeholder={props.showEmptyPlaceholder && memberIds.length === 0 ? 'Empty' : ''}
        renderTags={() => (
          <Stack flexDirection='row' flexWrap='wrap' gap={1}>
            {memberIds.map((memberId) => {
              const user = membersRecord[memberId];
              if (!user) {
                return null;
              }
              return (
                <Stack alignItems='center' flexDirection='row' key={user.id} gap={0.5}>
                  <UserDisplay fontSize={14} avatarSize='xSmall' user={user} />
                  {!props.readOnly && clicked && (
                    <IconButton size='small'>
                      <CloseIcon
                        sx={{
                          fontSize: 14
                        }}
                        cursor='pointer'
                        fontSize='small'
                        color='secondary'
                        onClick={() => setMemberIds(memberIds.filter((_memberId) => _memberId !== user.id))}
                      />
                    </IconButton>
                  )}
                </Stack>
              );
            })}
          </Stack>
        )}
      />
    </StyledUserPropertyContainer>
  );
}

export default UserProperty;
