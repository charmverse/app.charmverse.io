import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect, useMemo, createContext, useContext, useState } from 'react';

import type { SETTINGS_TABS, ACCOUNT_TABS } from 'components/settings/config';

type SettingsPath = (typeof SETTINGS_TABS)[number]['path'] | (typeof ACCOUNT_TABS)[number]['path'];

type IContext = {
  open: boolean;
  activePath: string;
  onClose: () => any;
  onClick: (path?: SettingsPath) => void;
};

export const SettingsDialogContext = createContext<Readonly<IContext>>({
  open: false,
  activePath: '',
  onClose: () => {},
  onClick: () => undefined
});

export function SettingsDialogProvider({ children }: { children: ReactNode }) {
  const settingsModalState = usePopupState({ variant: 'dialog', popupId: 'settings-dialog' });
  const [activePath, setActivePath] = useState('');
  const router = useRouter();

  const onClick = (_path?: string) => {
    setActivePath(_path ?? '');
    settingsModalState.open();
  };

  const onClose = () => {
    settingsModalState.close();
    setActivePath('');
  };

  useEffect(() => {
    const close = () => {
      if (router.query.pageId) {
        onClose();
      }
    };
    // If the user clicks a link inside the modal, close the modal only
    router.events.on('routeChangeStart', close);

    return () => {
      router.events.off('routeChangeStart', close);
    };
  }, [router]);

  const value = useMemo<IContext>(
    () => ({
      open: settingsModalState.isOpen,
      activePath,
      onClick,
      onClose
    }),
    [activePath, settingsModalState.isOpen]
  );

  return <SettingsDialogContext.Provider value={value}>{children}</SettingsDialogContext.Provider>;
}

export const useSettingsDialog = () => useContext(SettingsDialogContext);
