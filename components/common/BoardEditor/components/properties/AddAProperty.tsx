import type { ReactNode } from 'react';

import Button from '../../focalboard/src/widgets/buttons/button';

type Props = {
  children: ReactNode;
  onClick: VoidFunction;
};

export function AddAPropertyButton({ children, onClick }: Props) {
  return (
    <div className='octo-propertyname add-property'>
      <Button onClick={onClick}>{children}</Button>
    </div>
  );
}
