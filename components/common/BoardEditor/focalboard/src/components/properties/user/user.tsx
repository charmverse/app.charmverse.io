// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Select from 'react-select';
import { CSSObject } from '@emotion/serialize';

import { useContributors, Contributor } from 'hooks/useContributors';
import UserDisplay from 'components/common/UserDisplay';

import { getSelectBaseStyle } from '../../../theme';

type Props = {
  value: string,
  readonly: boolean,
  onChange: (value: string) => void,
}

const selectStyles = {
  ...getSelectBaseStyle(),
  placeholder: (provided: CSSObject): CSSObject => ({
    ...provided,
    color: 'rgba(var(--center-channel-color-rgb), 0.4)'
  })
};

function UserProperty (props: Props): JSX.Element {
  const [contributors] = useContributors();
  const contributorMap = contributors.reduce<Record<string, Contributor>>((acc, contributor) => {
    acc[contributor.id] = contributor;
    return acc;
  }, {})

  if (props.readonly) {
    return (
      <div className='UserProperty octo-propertyvalue readonly'>
        {contributorMap[props.value]?.username || (props.value ? '(missing name)' : '')}
      </div>
    );
  }

  return (
    <Select
      options={contributors}
      isSearchable={true}
      isClearable={true}
      backspaceRemovesValue={true}
      className='UserProperty octo-propertyvalue'
      classNamePrefix='react-select'
      formatOptionLabel={u => <UserDisplay user={u} avatarSize='small' />}
      styles={selectStyles}
      placeholder='Empty'
      getOptionLabel={(o: Contributor) => o.username}
      getOptionValue={(a: Contributor) => a.id}
      value={contributorMap[props.value] || null}
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
