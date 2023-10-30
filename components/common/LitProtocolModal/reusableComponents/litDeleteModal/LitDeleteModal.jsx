import React from "react";

const LitDeleteModal = ({ showDeleteModal, onClick }) => {

  return (
    <div>
      {!!showDeleteModal && (
        <div className={'lsm-delete-modal-container'}>
          <div className={'lsm-delete-modal'}>
            <h3 className={'lsm-delete-modal-prompt'}>Are you sure you want to delete this access control condition?</h3>
            <span className={'lsm-delete-modal-button-container'}>
                <button className={'lsm-delete-modal-button-no'}
                        onClick={() => onClick('no')}>
                NO
              </button>
              <button
                className={'lsm-delete-modal-button-yes'}
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

export default LitDeleteModal;
