
import React, { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import Button from '../widgets/buttons/button';

import Dialog from './dialog';

type ConfirmationDialogBoxProps = {
    heading: string;
    subText?: string;
    confirmButtonText?: string;
    onConfirm: () => void;
    onClose: () => void;
}

type Props = {
    dialogBox: ConfirmationDialogBoxProps;
}

export function ConfirmationDialogBox (props: Props) {
  const handleOnClose = useCallback(props.dialogBox.onClose, []);
  const handleOnConfirm = useCallback(props.dialogBox.onConfirm, []);

  return (
    <Dialog
      className='confirmation-dialog-box'
      onClose={handleOnClose}
    >
      <div
        className='box-area'
        title='Confirmation Dialog Box'
      >
        <h3 className='text-heading5'>{props.dialogBox.heading}</h3>
        <div className='sub-text'>{props.dialogBox.subText}</div>

        <div className='action-buttons'>
          <Button
            title='Cancel'
            size='medium'
            emphasis='tertiary'
            onClick={handleOnClose}
          >
            <FormattedMessage
              id='ConfirmationDialog.cancel-action'
              defaultMessage='Cancel'
            />
          </Button>
          <Button
            title={props.dialogBox.confirmButtonText || 'Confirm'}
            size='medium'
            submit={true}
            emphasis='danger'
            onClick={handleOnConfirm}
          >
            { props.dialogBox.confirmButtonText
                        || (
                          <FormattedMessage
                            id='ConfirmationDialog.confirm-action'
                            defaultMessage='Confirm'
                          />
                        )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default ConfirmationDialogBox;
export type { ConfirmationDialogBoxProps };
