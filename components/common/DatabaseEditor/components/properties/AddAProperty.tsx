import type { ReactNode } from 'react';

import type { NestedDataTest } from 'testing/e2eType';

import Button from '../../widgets/buttons/button';

type Props = {
  children: ReactNode;
  onClick: VoidFunction;
  style?: any;
  disabled?: boolean;
};

export function AddAPropertyButton({
  disabled,
  children,
  style,
  onClick,
  dataTest = 'add-property'
}: Props & NestedDataTest) {
  return (
    <div className='octo-propertyname add-property' style={style}>
      <Button dataTest={dataTest} onClick={onClick} disabled={disabled}>
        {children}
      </Button>
    </div>
  );
}
