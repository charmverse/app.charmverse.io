
import type { CSSObject } from '@emotion/serialize';
import Select from 'react-select';

import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';

import { getSelectBaseStyle } from '../../../theme';

type Props = {
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
}

const selectStyles = {
  ...getSelectBaseStyle(),
  placeholder: (provided: CSSObject): CSSObject => ({
    ...provided,
    color: 'rgba(var(--center-channel-color-rgb), 0.4)'
  })
};

function UserProperty (props: Props): JSX.Element | null {
  const { members } = useMembers();
  const memberMap = members.reduce<Record<string, Member>>((acc, member) => {
    acc[member.id] = member;
    return acc;
  }, {});

  if (props.readOnly) {
    if (memberMap[props.value]) {
      return (
        <div className='UserProperty octo-propertyvalue'>
          <UserDisplay user={memberMap[props.value]} avatarSize='xSmall' fontSize='small' />
        </div>
      );
    }
    return null;
  }

  return (
    <Select
      options={members}
      isSearchable={true}
      isClearable={true}
      backspaceRemovesValue={true}
      className='UserProperty octo-propertyvalue'
      classNamePrefix='react-select'
      // eslint-disable-next-line react/no-unstable-nested-components
      formatOptionLabel={u => <UserDisplay user={u} avatarSize='small' fontSize='small' />}
      styles={selectStyles}
      placeholder='Empty'
      getOptionLabel={(o: Member) => o.username}
      getOptionValue={(a: Member) => a.id}
      value={memberMap[props.value] || null}
      onChange={(item, action) => {
        if (action.action === 'select-option') {
          props.onChange(item?.id || '');
        }
        else if (action.action === 'clear') {
          props.onChange('');
        }
      }}
    />
  );
}

export default UserProperty;
