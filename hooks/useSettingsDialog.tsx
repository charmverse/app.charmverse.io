import { usePopupState, bindDialog, bindTrigger } from 'material-ui-popup-state/hooks';
import type { MouseEvent, ReactNode, SyntheticEvent, TouchEvent } from 'react';
import { useMemo, createContext, useContext, useState } from 'react';

type MobileView = 'sidebar' | 'content';

type IContext = {
  activePath: string;
  setActivePath: (path: string) => void;
  mobileView: MobileView;
  setMobileView: (view: MobileView) => void;
  open: boolean;
  onClose: (event: SyntheticEvent<Element, Event>) => any;
  onClick: (event: MouseEvent<Element, globalThis.MouseEvent>, path?: string) => void;
  onTouchStart: (event: TouchEvent<Element>, path?: string) => void;
};

export const SettingsDialogContext = createContext<Readonly<IContext>>({
  activePath: '',
  setActivePath: () => undefined,
  mobileView: 'sidebar',
  setMobileView: () => undefined,
  open: false,
  onClose: () => {},
  onClick: () => undefined,
  onTouchStart: () => undefined
});

export function SettingsDialogProvider({ children }: { children: ReactNode }) {
  const settingsModalState = usePopupState({ variant: 'dialog', popupId: 'settings-dialog' });
  const [activePath, setActivePath] = useState('');
  const [mobileView, setMobileView] = useState<MobileView>('sidebar');

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

  const initialSettingsDialogState = { ...bindDialog(settingsModalState) };
  const settingsDialogState = {
    ...initialSettingsDialogState,
    onClose: (event: SyntheticEvent<Element, Event>) => {
      initialSettingsDialogState.onClose(event);
      setMobileView('sidebar');
    }
  };

  const value = useMemo<IContext>(
    () => ({
      activePath,
      mobileView,
      setActivePath,
      setMobileView,
      ...triggerDialogState,
      ...settingsDialogState
    }),
    [triggerDialogState, settingsDialogState, mobileView, activePath]
  );

  return <SettingsDialogContext.Provider value={value}>{children}</SettingsDialogContext.Provider>;
}

export const useSettingsDialog = () => useContext(SettingsDialogContext);
