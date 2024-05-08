import type { ReactNode } from 'react';

import Button from '../../widgets/buttons/button';

type Props = {
  children: ReactNode;
  onClick: VoidFunction;
  style?: any;
  disabled?: boolean;
  'data-test'?: string;
};

export function AddAPropertyButton({
  disabled,
  children,
  style,
  onClick,
  'data-test': dataTest = 'add-property'
}: Props) {
  return (
    <div className='octo-propertyname add-property' style={style}>
      <Button data-test={dataTest} onClick={onClick} disabled={disabled}>
        {children}
      </Button>
    </div>
  );
}
