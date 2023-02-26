import styled from '@emotion/styled';
import { Popover, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import { InputSearchMember } from 'components/common/form/InputSearchMember';
import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';

type Props = {
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
  showEmptyPlaceholder?: boolean;
};

const StyledUserPropertyContainer = styled(Box)`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: 100%;
  height: 100%;
  display: flex;
`;

function UserProperty(props: Props): JSX.Element | null {
  const popupState = usePopupState({ variant: 'popover', popupId: `user-property-members` });

  const { members } = useMembers();
  const memberMap = members.reduce<Record<string, Member>>((acc, member) => {
    acc[member.id] = member;
    return acc;
  }, {});

  if (props.readOnly) {
    if (memberMap[props.value]) {
      return (
        <StyledUserPropertyContainer>
          <div className='UserProperty readonly octo-propertyvalue'>
            <UserDisplay user={memberMap[props.value]} avatarSize='xSmall' fontSize='small' />
          </div>
        </StyledUserPropertyContainer>
      );
    }
    return null;
  }

  return (
    <>
      {memberMap[props.value] ? (
        <StyledUserPropertyContainer {...bindTrigger(popupState)}>
          <div className='UserProperty readonly octo-propertyvalue'>
            <UserDisplay user={memberMap[props.value]} avatarSize='xSmall' fontSize='small' />
          </div>
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
        <InputSearchMember
          defaultValue={memberMap[props.value]?.id ?? null}
          onChange={(memberId) => {
            props.onChange(memberId);
          }}
          openOnFocus
          onClear={() => {
            props.onChange('');
          }}
        />
      </Popover>
    </>
  );
}

export default UserProperty;
