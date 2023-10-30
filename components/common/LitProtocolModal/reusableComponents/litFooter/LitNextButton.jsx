import React from 'react';

const LitNextButton = ({ disabled = false, onClick, label}) => {

  return (
    <button className={'lsm-next-button'}
            disabled={disabled}
            onClick={onClick}>
      <span className={'lsm-next-label'}>{!label ? 'NEXT' : label}</span>
      <span className={'lsm-next-arrow'}>→</span>
    </button>
  );
};

export default LitNextButton;
