
import React from 'react';

import UserProperty from '../user/user';

type Props = {
    userID: string
}

function CreatedBy (props: Props): JSX.Element {
  return (
    <UserProperty
      value={props.userID}
      readonly={true} // created by is an immutable property, so will always be readonly
      onChange={() => {}}
    />
  );
}

export default CreatedBy;
