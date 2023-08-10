import type { ReactNode } from 'react';

import Button from '../../focalboard/src/widgets/buttons/button';

type Props = {
  children: ReactNode;
  onClick: VoidFunction;
  style?: any;
};

export function AddAPropertyButton({ children, style, onClick }: Props) {
  return (
    <div className='octo-propertyname add-property' style={style}>
      <Button onClick={onClick}>{children}</Button>
    </div>
  );
}
