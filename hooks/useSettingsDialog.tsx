import path from 'path';

import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { useMemo, createContext, useContext, useState } from 'react';

import type { TasksPageProps } from 'components/nexus/TasksPage';

import { useSpaces } from './useSpaces';

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

  const { memberSpaces } = useSpaces();

  const onClick = (_path?: string, props?: PathProps) => {
    // This is a hack to fix a bug where the user can see space settings on popup
    // We should come back and cleanup how we manage the state of the space dialog in a future PR
    if (_path && _path.endsWith('-space')) {
      const spaceName = _path.split('-space')[0];
      const space = memberSpaces.find((s) => s.name === spaceName);
      if (!space) {
        settingsModalState.open();
        setActivePath('account');
        return;
      }
    }

    setActivePath(_path ?? '');
    settingsModalState.open();
    setPathProps(props);
  };

  const onClose = () => {
    settingsModalState.close();
    setActivePath('');
  };
  const value = useMemo<IContext>(
    () => ({
      open: settingsModalState.isOpen,
      activePath,
      pathProps,
      onClick,
      onClose
    }),
    [activePath, pathProps, settingsModalState.isOpen, memberSpaces]
  );

  return <SettingsDialogContext.Provider value={value}>{children}</SettingsDialogContext.Provider>;
}

export const useSettingsDialog = () => useContext(SettingsDialogContext);
