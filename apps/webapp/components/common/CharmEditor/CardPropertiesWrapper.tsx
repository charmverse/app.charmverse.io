import type { ReactNode } from 'react';

export function CardPropertiesWrapper({ children }: { children: ReactNode }) {
  return (
    <div className='focalboard-body font-family-default'>
      <div className='CardDetail content'>{children}</div>
    </div>
  );
}
