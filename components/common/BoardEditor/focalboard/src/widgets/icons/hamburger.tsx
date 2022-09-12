
import React from 'react';

export default function HamburgerIcon (): JSX.Element {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className='HamburgerIcon Icon'
      viewBox='0 0 100 100'
    >
      <polyline points='20,25 80,25' />
      <polyline points='20,50 80,50' />
      <polyline points='20,75 80,75' />
    </svg>
  );
}
