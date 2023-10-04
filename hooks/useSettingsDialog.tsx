import { log } from '@charmverse/core/log';
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
  isOpen: boolean;
  activePath?: SettingsPath;
  unsavedChanges: boolean;
  onClose: () => void;
  openSettings: (path?: SettingsPath, section?: string) => void;
  openUpgradeSubscription: () => void;
  handleUnsavedChanges: (dataChanged: boolean) => void;
};

export const SettingsDialogContext = createContext<Readonly<IContext>>({
  isOpen: false,
  unsavedChanges: false,
  onClose: () => {},
  openSettings: () => undefined,
  openUpgradeSubscription: () => null,
  handleUnsavedChanges: () => undefined
});

export function SettingsDialogProvider({ children }: { children: ReactNode }) {
  const settingsModalState = usePopupState({ variant: 'dialog', popupId: 'settings-dialog' });
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activePath, setActivePath] = useState<SettingsPath | undefined>();
  const router = useRouter();
  const { subscriptionEnded, spaceSubscription } = useSpaceSubscription();

  const openSettings = (_path?: SettingsPath, _section?: string) => {
    setActivePath(_path);
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
    setActivePath(undefined);
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
      openSettings(router.query.settingTab as SettingsPath);
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
      log.warn('Open upgrade subscription modal since subscription has ended', spaceSubscription);
      // openUpgradeSubscription();
    }
  }, [subscriptionEnded]);

  function openUpgradeSubscription() {
    openSettings('subscription');
  }

  const value = useMemo<IContext>(
    () => ({
      isOpen: settingsModalState.isOpen,
      activePath,
      unsavedChanges,
      openSettings,
      onClose,
      openUpgradeSubscription,
      handleUnsavedChanges
    }),
    [activePath, settingsModalState.isOpen, unsavedChanges]
  );

  return <SettingsDialogContext.Provider value={value}>{children}</SettingsDialogContext.Provider>;
}

export const useSettingsDialog = () => useContext(SettingsDialogContext);
