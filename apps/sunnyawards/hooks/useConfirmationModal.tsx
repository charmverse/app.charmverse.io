import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import type { ConfirmationModalProps } from 'components/common/Modal/ConfirmationModal';

type ConfirmationModalResult = { confirmed?: true; cancelled?: true };

type IContext = {
  props: ConfirmationModalProps;
  showConfirmation: (
    msg: string | Omit<ConfirmationModalProps, 'isOpen'>,
    requiredText?: string
  ) => Promise<ConfirmationModalResult>;
};
export const ConfirmationModalContext = createContext<Readonly<IContext>>({
  props: {
    message: '',
    isOpen: false,
    onCancel: () => {},
    onConfirm: () => {}
  },
  showConfirmation: () => Promise.resolve({})
});

export function ConfirmationModalProvider({ children }: { children: ReactNode }) {
  const [props, setProps] = useState<ConfirmationModalProps>({
    message: '',
    isOpen: false,
    onCancel: () => {},
    onConfirm: async () => {}
  });

  // return a promise thar resolves once the user makes a decision
  function showConfirmation(msg: string | Omit<ConfirmationModalProps, 'isOpen'>) {
    return new Promise<ConfirmationModalResult>((resolve) => {
      function onCancel() {
        if (typeof msg !== 'string') msg?.onCancel?.();
        resolve({ cancelled: true });
        setProps((_props) => ({ ..._props, isOpen: false }));
      }
      async function onConfirm() {
        if (typeof msg !== 'string') await msg?.onConfirm?.();
        resolve({ confirmed: true });
        setProps((_props) => ({ ..._props, isOpen: false }));
      }
      if (typeof msg === 'string') {
        setProps({ isOpen: true, message: msg, onCancel, onConfirm });
      } else {
        setProps({
          isOpen: true,
          message: msg.message,
          title: msg.title,
          onCancel,
          confirmButton: msg.confirmButton,
          onConfirm,
          requiredText: msg.requiredText
        });
      }
    });
  }

  const value = useMemo<IContext>(
    () => ({
      props,
      showConfirmation
    }),
    [props]
  );

  return <ConfirmationModalContext.Provider value={value}>{children}</ConfirmationModalContext.Provider>;
}

export const useConfirmationModal = () => useContext(ConfirmationModalContext);
