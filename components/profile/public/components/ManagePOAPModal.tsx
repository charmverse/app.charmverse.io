
import { Modal, DialogTitle } from 'components/common/Modal';

type ManagePOAPModalProps = {
    save: (description: string) => void,
    close: () => void,
    isOpen: boolean,
};

function ManagePOAPModal (props: ManagePOAPModalProps) {
  const { close, isOpen, save } = props;

  return (
    <Modal open={isOpen} onClose={close} size='large'>
      <DialogTitle onClose={close}>Describe yourself in a few words</DialogTitle>

    </Modal>
  );
}

export default ManagePOAPModal;
