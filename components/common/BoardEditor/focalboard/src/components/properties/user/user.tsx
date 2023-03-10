import styled from '@emotion/styled';
import { Menu, Typography } from '@mui/material';
import { Box, Stack } from '@mui/system';
import type { MouseEvent } from 'react';
import { useState } from 'react';

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
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: 100%;
  height: 100%;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

function UserProperty(props: Props): JSX.Element | null {
  // Using a local state to not close the dropdown after selecting an option
  const [memberIds, setMemberIds] = useState(props.memberIds ?? []);
  const { members } = useMembers();
  const memberMap = members.reduce<Record<string, Member>>((acc, member) => {
    acc[member.id] = member;
    return acc;
  }, {});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(() => {
    return null;
  });
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  if (props.readOnly) {
    if (memberIds.length === 0) {
      return null;
    }

    return (
      <StyledUserPropertyContainer>
        {memberIds.map((memberId) =>
          memberMap[memberId] ? (
            <div key={memberId} style={{ width: 'fit-content' }} className='UserProperty readonly octo-propertyvalue'>
              <UserDisplay user={memberMap[memberId]} avatarSize='xSmall' fontSize='small' />
            </div>
          ) : null
        )}
      </StyledUserPropertyContainer>
    );
  }

  return (
    <Stack onClick={handleClick}>
      {memberIds.length !== 0 ? (
        <StyledUserPropertyContainer>
          {memberIds.map((memberId) =>
            memberMap[memberId] ? (
              <div key={memberId} style={{ width: 'fit-content' }} className='UserProperty readonly octo-propertyvalue'>
                <UserDisplay user={memberMap[memberId]} avatarSize='xSmall' fontSize='small' />
              </div>
            ) : null
          )}
        </StyledUserPropertyContainer>
      ) : (
        <Typography
          component='span'
          variant='subtitle2'
          className='octo-propertyvalue'
          sx={{ opacity: 0.4, pl: '2px', width: '100%', height: '100%' }}
        >
          {props.showEmptyPlaceholder ? 'Empty' : ''}
        </Typography>
      )}
      <Menu
        anchorEl={anchorEl}
        open={open}
        PaperProps={{
          sx: { width: 300 }
        }}
        onClose={(...a) => {
          props.onChange(memberIds);
          handleClose();
        }}
      >
        <InputSearchMemberMultiple
          disableCloseOnSelect
          defaultValue={memberIds}
          onInputChange={(_, __, reason) => {
            if (reason === 'clear') {
              setMemberIds([]);
            }
          }}
          onChange={(_memberIds) => {
            setMemberIds(_memberIds);
          }}
          openOnFocus
        />
      </Menu>
    </Stack>
  );
}

export default UserProperty;
