import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect, useMemo, createContext, useContext, useState } from 'react';

import { SPACE_SETTINGS_TABS } from 'components/settings/config';
import type { ACCOUNT_TABS } from 'components/settings/config';
import { setUrlWithoutRerender } from 'lib/utils/browser';

export type SettingsPath = (typeof SPACE_SETTINGS_TABS)[number]['path'] | (typeof ACCOUNT_TABS)[number]['path'];

type IContext = {
  isOpen: boolean;
  activePath?: SettingsPath;
  onClose: () => void;
  openSettings: (path?: SettingsPath, section?: string) => void;
  openUpgradeSubscription: () => void;
};

export const SettingsDialogContext = createContext<Readonly<IContext>>({
  isOpen: false,
  onClose: () => {},
  openSettings: () => undefined,
  openUpgradeSubscription: () => null
});

export function SettingsDialogProvider({ children }: { children: ReactNode }) {
  const settingsModalState = usePopupState({ variant: 'dialog', popupId: 'settings-dialog' });
  const [activePath, setActivePath] = useState<SettingsPath | undefined>();
  const router = useRouter();

  function openSettings(_path?: SettingsPath, _section?: string) {
    setActivePath(_path);
    settingsModalState.open();
    setTimeout(() => {
      if (_section) {
        const domSection = document.getElementById(_section);
        domSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  }

  function onClose() {
    settingsModalState.close();
    setActivePath(undefined);
  }

  function openUpgradeSubscription() {
    openSettings('subscription');
  }

  useEffect(() => {
    const close = () => {
      if (router.query.pageId) {
        onClose();
      }
    };

    if (router.query.settingTab && SPACE_SETTINGS_TABS.some((tab) => tab.path === router.query.settingTab)) {
      openSettings(router.query.settingTab as SettingsPath);
      setUrlWithoutRerender(router.pathname, { settingTab: null });
    }
    // If the user clicks a link inside the modal, close the modal only
    router.events.on('routeChangeStart', close);

    return () => {
      router.events.off('routeChangeStart', close);
    };
  }, [router]);

  const value = useMemo<IContext>(
    () => ({
      isOpen: settingsModalState.isOpen,
      activePath,
      openSettings,
      onClose,
      openUpgradeSubscription
    }),
    [activePath, settingsModalState.isOpen]
  );

  return <SettingsDialogContext.Provider value={value}>{children}</SettingsDialogContext.Provider>;
}

export const useSettingsDialog = () => useContext(SettingsDialogContext);
