import React from "react";

const LitConfirmationModal = ({ showConfirmationModal, onClick, message = null }) => {

  return (
    <div>
      {!!showConfirmationModal && (
        <div className={'lsm-confirmation-modal-container'}>
          <div className={'lsm-confirmation-modal'}>
            <h3 className={'lsm-confirmation-modal-prompt'}>{!message ? 'Are you sure you want to go back? Current conditions will be lost.' : message}</h3>
            <span className={'lsm-confirmation-modal-button-container'}>
                <button className={'lsm-confirmation-modal-button-no'}
                        onClick={() => onClick('no')}>
                NO
              </button>
              <button
                className={'lsm-confirmation-modal-button-yes'}
                onClick={() => onClick('yes')}>
                YES
              </button>
          </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default LitConfirmationModal;
