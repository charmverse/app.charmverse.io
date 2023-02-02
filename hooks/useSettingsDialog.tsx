import { usePopupState, bindDialog, bindTrigger } from 'material-ui-popup-state/hooks';
import type { MouseEvent, ReactNode, SyntheticEvent, TouchEvent } from 'react';
import { useMemo, createContext, useContext, useState } from 'react';

type IContext = {
  activePath: string;
  setActivePath: (path: string) => void;
  open: boolean;
  onClose: (event: SyntheticEvent<Element, Event>) => any;
  'aria-controls'?: string | undefined;
  'aria-describedby'?: string | undefined;
  'aria-haspopup'?: true | undefined;
  onClick: (event: MouseEvent<Element, globalThis.MouseEvent>, path?: string) => void;
  onTouchStart: (event: TouchEvent<Element>, path?: string) => void;
};

export const SettingsDialogContext = createContext<Readonly<IContext>>({
  activePath: '',
  setActivePath: () => undefined,
  open: false,
  'aria-controls': undefined,
  'aria-describedby': undefined,
  'aria-haspopup': undefined,
  onClose: () => {},
  onClick: () => undefined,
  onTouchStart: () => undefined
});

export function SettingsDialogProvider({ children }: { children: ReactNode }) {
  const settingsModalState = usePopupState({ variant: 'dialog', popupId: 'settings-dialog' });
  const [activePath, setActivePath] = useState('');

  const initialTriggerDialogState = { ...bindTrigger(settingsModalState) };
  const triggerDialogState = {
    ...initialTriggerDialogState,
    onClick: (event: MouseEvent<Element, globalThis.MouseEvent>, _path?: string) => {
      setActivePath(_path ?? '');
      initialTriggerDialogState.onClick(event);
    },
    onTouchStart: (event: TouchEvent<Element>, _path?: string) => {
      setActivePath(_path ?? '');
      initialTriggerDialogState.onTouchStart(event);
    }
  };
  const settingsDialogState = { ...bindDialog(settingsModalState) };

  const value = useMemo<IContext>(
    () => ({
      activePath,
      setActivePath,
      ...triggerDialogState,
      ...settingsDialogState
    }),
    [triggerDialogState, settingsDialogState, activePath]
  );

  return <SettingsDialogContext.Provider value={value}>{children}</SettingsDialogContext.Provider>;
}

export const useSettingsDialog = () => useContext(SettingsDialogContext);
