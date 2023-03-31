import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect, useMemo, createContext, useContext, useState } from 'react';

import type { TasksPageProps } from 'components/nexus/TasksPage';

export type PathProps = TasksPageProps;

type IContext = {
  open: boolean;
  activePath: string;
  pathProps?: PathProps | null;
  onClose: () => any;
  onClick: (path?: string, props?: PathProps) => void;
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
  const [pathProps, setPathProps] = useState<PathProps | undefined>();
  const router = useRouter();

  const onClick = (_path?: string, props?: PathProps) => {
    setActivePath(_path ?? '');
    settingsModalState.open();
    setPathProps(props);
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
      pathProps,
      onClick,
      onClose
    }),
    [activePath, pathProps, settingsModalState.isOpen]
  );

  return <SettingsDialogContext.Provider value={value}>{children}</SettingsDialogContext.Provider>;
}

export const useSettingsDialog = () => useContext(SettingsDialogContext);
