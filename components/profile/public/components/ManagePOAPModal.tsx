
import { Modal, DialogTitle } from 'components/common/Modal';

type ManagePOAPModalProps = {
    save: (description: string) => void,
    close: () => void,
    isOpen: boolean,
};

function ManagePOAPModal (props: ManagePOAPModalProps) {
  const { close, isOpen, save } = props;

  return (
    <Modal
      open={isOpen}
      onClose={close}
      sx={{
        '>.modal-container': {
          maxWidth: '670px',
          width: '100%'
        }
      }}
    >
      <DialogTitle onClose={close}>Describe yourself in a few words</DialogTitle>

    </Modal>
  );
}

export default ManagePOAPModal;
