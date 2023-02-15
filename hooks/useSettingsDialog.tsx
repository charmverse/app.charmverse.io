import type { ReactNode } from 'react';
import { useMemo, createContext, useContext, useState } from 'react';

import type { TasksPageProps } from 'components/nexus/TasksPage';

export type PathProps = TasksPageProps;

type IContext = {
  activePath: string;
  pathProps?: PathProps | null;
  onClose: () => any;
  onClick: (path?: string, props?: PathProps) => void;
};

export const SettingsDialogContext = createContext<Readonly<IContext>>({
  activePath: '',
  onClose: () => {},
  onClick: () => undefined
});

export function SettingsDialogProvider({ children }: { children: ReactNode }) {
  const [activePath, setActivePath] = useState('');
  const [pathProps, setPathProps] = useState<PathProps | undefined>();

  const onClick = (_path?: string, props?: PathProps) => {
    setActivePath(_path ?? '');
    setPathProps(props);
  };

  const onClose = () => {
    setActivePath('');
  };

  const value = useMemo<IContext>(
    () => ({
      activePath,
      pathProps,
      onClick,
      onClose
    }),
    [activePath]
  );

  return <SettingsDialogContext.Provider value={value}>{children}</SettingsDialogContext.Provider>;
}

export const useSettingsDialog = () => useContext(SettingsDialogContext);
