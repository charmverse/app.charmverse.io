import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { Box, Stack } from '@mui/system';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { PropertyValueDisplayType } from 'components/common/BoardEditor/interfaces';
import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';
import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';

type Props = {
  memberIds: string[];
  readOnly: boolean;
  onChange: (memberIds: string[]) => void;
  showEmptyPlaceholder?: boolean;
  displayType?: PropertyValueDisplayType;
  wrapColumn?: boolean;
};

const StyledUserPropertyContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'hideInput' && prop !== 'hideOverflow'
})<{
  hideOverflow: boolean;
  hideInput?: boolean;
}>`
  width: 100%;
  height: 100%;
  overflow: ${({ hideOverflow }) => (hideOverflow ? 'hidden' : 'initial')};
  & .MuiInputBase-root,
  & input.MuiInputBase-input {
    background: inherit;
    /** this overflows to the next line on smaller width */
    position: ${({ hideInput }) => (!hideInput ? `inherit` : 'absolute')};
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

function MembersDisplay({
  memberIds,
  clicked,
  readOnly,
  setMemberIds,
  wrapColumn
}: {
  wrapColumn: boolean;
  readOnly: boolean;
  clicked: boolean;
  memberIds: string[];
  setMemberIds: (memberIds: string[]) => void;
}) {
  const { membersRecord } = useMembers();

  const enableDelete = !readOnly && clicked;

  function removeMember(memberId: string) {
    setMemberIds(memberIds.filter((_memberId) => _memberId !== memberId));
  }

  return memberIds.length === 0 ? null : (
    <Stack flexDirection='row' flexWrap={wrapColumn ? 'wrap' : 'nowrap'} gap={1}>
      {memberIds.map((memberId) => {
        const user = membersRecord[memberId];
        if (!user) {
          return null;
        }

        return (
          <Stack
            alignItems='center'
            flexDirection='row'
            key={user.id}
            gap={0.5}
            sx={wrapColumn ? { width: '100%', justifyContent: 'space-between' } : { overflowX: 'hidden' }}
            onClick={enableDelete ? () => removeMember(user.id) : undefined}
          >
            <UserDisplay fontSize={14} avatarSize='xSmall' user={user} wrapName={wrapColumn} />
            {enableDelete && (
              <IconButton size='small'>
                <CloseIcon
                  sx={{
                    fontSize: 14
                  }}
                  cursor='pointer'
                  fontSize='small'
                  color='secondary'
                  onClick={() => removeMember(user.id)}
                />
              </IconButton>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}

function UserProperty(props: Props): JSX.Element | null {
  const { membersRecord } = useMembers();
  const [memberIds, setMemberIds] = useState(getFilteredMemberIds(props.memberIds, membersRecord));
  const [clicked, setClicked] = useState(false);
  const membersValue = useMemo(
    () => memberIds.map((memberId) => membersRecord[memberId]).filter((member) => member !== undefined),
    [memberIds, membersRecord]
  );

  const [isOpen, setIsOpen] = useState(false);

  const updateMemberIds = useCallback(
    (unfilteredIds: string[]) => {
      setMemberIds(getFilteredMemberIds(unfilteredIds, membersRecord));
    },
    [membersRecord]
  );

  useEffect(() => {
    updateMemberIds(props.memberIds);
  }, [props.memberIds, updateMemberIds]);

  function saveUsers(_memberIds: string[]) {
    if (!props.readOnly && !arrayEquals(_memberIds, props.memberIds)) {
      props.onChange(_memberIds);
    }
  }

  if (props.readOnly || !isOpen) {
    return (
      <div
        style={{ width: '100%', height: '100%' }}
        onClick={
          !props.readOnly
            ? () => {
                setClicked(true);
                setIsOpen(true);
              }
            : undefined
        }
      >
        <MembersDisplay
          wrapColumn={props.wrapColumn ?? false}
          readOnly={props.readOnly}
          clicked={clicked}
          memberIds={memberIds}
          setMemberIds={updateMemberIds}
        />
      </div>
    );
  }
  return (
    <ClickAwayListener
      onClickAway={(ev) => {
        setClicked(false);
        setIsOpen(false);
        saveUsers(memberIds);
      }}
    >
      <StyledUserPropertyContainer
        hideOverflow={props.displayType === 'table'}
        onClick={() => {
          // Only register click if display type is details or table
          if (!props.readOnly) {
            setIsOpen(true);
            setClicked(true);
          }
        }}
        hideInput={props.readOnly || (props.displayType !== 'details' && !clicked)}
      >
        <InputSearchMemberMultiple
          // sx={{ '& .MuiAutocomplete-paper': { margin: 0, marginTop: '-20px' } }}
          disableClearable
          open={isOpen}
          openOnFocus
          disableCloseOnSelect
          defaultValue={memberIds}
          value={membersValue}
          onChange={(_memberIds) => {
            updateMemberIds(_memberIds);
          }}
          getOptionLabel={(user) => (typeof user === 'string' ? user : user?.username)}
          readOnly={props.readOnly}
          placeholder={props.showEmptyPlaceholder && memberIds.length === 0 ? 'Empty' : ''}
          renderTags={() => (
            <MembersDisplay
              wrapColumn={props.displayType === 'table' ? true : props.wrapColumn ?? false}
              readOnly={props.readOnly}
              clicked={clicked}
              memberIds={memberIds}
              setMemberIds={updateMemberIds}
            />
          )}
        />
      </StyledUserPropertyContainer>
    </ClickAwayListener>
  );
}

function getFilteredMemberIds(memberIds: string[], membersRecord: Record<string, Member>): string[] {
  return memberIds.filter((memberId) => membersRecord[memberId] !== undefined);
}

export default UserProperty;
