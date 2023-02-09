import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { useMemo, createContext, useContext, useState } from 'react';

type IContext = {
  activePath: string;
  open: boolean;
  onClose: () => any;
  onClick: (path?: string) => void;
};

export const SettingsDialogContext = createContext<Readonly<IContext>>({
  activePath: '',
  open: false,
  onClose: () => {},
  onClick: () => undefined
});

export function SettingsDialogProvider({ children }: { children: ReactNode }) {
  const settingsModalState = usePopupState({ variant: 'dialog', popupId: 'settings-dialog' });
  const [activePath, setActivePath] = useState('');

  const onClick = (_path?: string) => {
    setActivePath(_path ?? '');
    settingsModalState.open(settingsModalState.anchorEl);
  };

  const onClose = () => {
    settingsModalState.close();
    setActivePath('');
  };

  const value = useMemo<IContext>(
    () => ({
      activePath,
      onClick,
      onClose,
      open: settingsModalState.isOpen
    }),
    [settingsModalState.isOpen, activePath]
  );

  return <SettingsDialogContext.Provider value={value}>{children}</SettingsDialogContext.Provider>;
}

export const useSettingsDialog = () => useContext(SettingsDialogContext);
