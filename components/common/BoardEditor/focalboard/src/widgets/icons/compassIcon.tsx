
import React from 'react';

type Props = {
    icon: string,
    className: string,
}

export default function CompassIcon (props: Props): JSX.Element {
  // All compass icon classes start with icon,
  // so not expecting that prefix in props.
  return (
    <i className={`CompassIcon icon-${props.icon} ${props.className}`} />
  );
}
