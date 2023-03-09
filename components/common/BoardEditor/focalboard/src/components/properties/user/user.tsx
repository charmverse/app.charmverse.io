import styled from '@emotion/styled';
import { Popover, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

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
  const popupState = usePopupState({ variant: 'popover', popupId: `user-property-members` });
  const { memberIds = [] } = props;
  const { members } = useMembers();
  const memberMap = members.reduce<Record<string, Member>>((acc, member) => {
    acc[member.id] = member;
    return acc;
  }, {});

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
    <>
      {memberIds.length !== 0 ? (
        <StyledUserPropertyContainer {...bindTrigger(popupState)}>
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
          {...bindTrigger(popupState)}
          component='span'
          variant='subtitle2'
          className='octo-propertyvalue'
          sx={{ opacity: 0.4, pl: '2px', width: '100%', height: '100%' }}
        >
          {props.showEmptyPlaceholder ? 'Empty' : ''}
        </Typography>
      )}
      <Popover
        {...bindPopover(popupState)}
        PaperProps={{
          sx: { width: 300 }
        }}
      >
        <InputSearchMemberMultiple
          defaultValue={memberIds}
          onChange={(_memberIds) => {
            props.onChange(_memberIds);
          }}
          openOnFocus
        />
      </Popover>
    </>
  );
}

export default UserProperty;
