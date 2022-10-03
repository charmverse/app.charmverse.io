import React from 'react';

type Props = {
    children: React.ReactNode;
}

const ModalWrapper = React.memo((props: Props) => {
  return (
    <div className='ModalWrapper'>
      {props.children}
    </div>
  );
});

export default ModalWrapper;
