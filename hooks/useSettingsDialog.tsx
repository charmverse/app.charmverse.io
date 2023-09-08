import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect, useMemo, createContext, useContext, useState } from 'react';

import type { ACCOUNT_TABS } from 'components/settings/config';
import { SETTINGS_TABS } from 'components/settings/config';
import { useSpaceSubscription } from 'components/settings/subscription/hooks/useSpaceSubscription';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

export type SettingsPath = (typeof SETTINGS_TABS)[number]['path'] | (typeof ACCOUNT_TABS)[number]['path'];

type IContext = {
  open: boolean;
  activePath: string;
  unsavedChanges: boolean;
  onClose: () => void;
  onClick: (path?: SettingsPath, section?: string) => void;
  openUpgradeSubscription: () => void;
  handleUnsavedChanges: (dataChanged: boolean) => void;
};

export const SettingsDialogContext = createContext<Readonly<IContext>>({
  open: false,
  activePath: '',
  unsavedChanges: false,
  onClose: () => {},
  onClick: () => undefined,
  openUpgradeSubscription: () => null,
  handleUnsavedChanges: () => undefined
});

export function SettingsDialogProvider({ children }: { children: ReactNode }) {
  const settingsModalState = usePopupState({ variant: 'dialog', popupId: 'settings-dialog' });
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activePath, setActivePath] = useState('');
  const router = useRouter();
  const { subscriptionEnded } = useSpaceSubscription();

  const onClick = (_path?: string, _section?: string) => {
    setActivePath(_path ?? '');
    settingsModalState.open();
    setTimeout(() => {
      if (_section) {
        const domSection = document.getElementById(_section);
        domSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  const onClose = () => {
    settingsModalState.close();
    setActivePath('');
  };

  const handleUnsavedChanges = (dataChanged: boolean) => {
    setUnsavedChanges(dataChanged);
  };

  useEffect(() => {
    const close = () => {
      if (router.query.pageId) {
        onClose();
      }
    };

    if (router.query.settingTab && SETTINGS_TABS.some((tab) => tab.path === router.query.settingTab)) {
      onClick(router.query.settingTab as string);
      setUrlWithoutRerender(router.pathname, { settingTab: null });
    }
    // If the user clicks a link inside the modal, close the modal only
    router.events.on('routeChangeStart', close);

    return () => {
      router.events.off('routeChangeStart', close);
    };
  }, [router]);

  useEffect(() => {
    if (subscriptionEnded) {
      openUpgradeSubscription();
    }
  }, [subscriptionEnded]);

  function openUpgradeSubscription() {
    onClick('subscription');
  }

  const value = useMemo<IContext>(
    () => ({
      open: settingsModalState.isOpen,
      activePath,
      unsavedChanges,
      onClick,
      onClose,
      openUpgradeSubscription,
      handleUnsavedChanges
    }),
    [activePath, settingsModalState.isOpen, unsavedChanges]
  );

  return <SettingsDialogContext.Provider value={value}>{children}</SettingsDialogContext.Provider>;
}

export const useSettingsDialog = () => useContext(SettingsDialogContext);
