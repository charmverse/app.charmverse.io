import type { ReactNode } from 'react';

import Button from '../../focalboard/src/widgets/buttons/button';

type PropertyLabelProps = {
  children: ReactNode;
  readOnly?: boolean;
};

export function PropertyLabel({ children, readOnly }: PropertyLabelProps) {
  if (readOnly) {
    return (
      <div className='octo-propertyname octo-propertyname--readonly'>
        <Button>{children}</Button>
      </div>
    );
  }
  return null;
}
