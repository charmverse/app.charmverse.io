import React from 'react';
import LitBackButton from "./LitBackButton";
import LitNextButton from "./LitNextButton";

const LitFooter = ({
                     backAction = null,
                     nextAction = null,
                     disableNextButton = null,
                     backgroundColor = 'lsm-bg-white',
                     nextButtonLabel = null
                   }) => {

  console.log('disable next button', disableNextButton)

  return (
    <div className={`${backgroundColor} lsm-lit-footer`}>
      {!!backAction && (
        <LitBackButton onClick={backAction} backgroundColor={backgroundColor}/>
      )}
      {!!nextAction && (
        <LitNextButton disabled={disableNextButton} onClick={nextAction} label={nextButtonLabel}/>
      )}
    </div>
  );
};

export default LitFooter;
