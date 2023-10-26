import React from 'react';

const LitChooseAccessButton = (props) => {
  return (
    <button className={"lsm-choose-access-button"}
            onClick={props.onClick}>
      {!!props['img'] && (<img className={'lsm-choose-access-button-icon'} src={props.img} />)}
      {props.label}
    </button>
  );
};

export default LitChooseAccessButton;
