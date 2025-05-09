import { useEffect, useMemo } from 'react';

import { isMac } from '@packages/lib/utils/browser';

type KeyConfig = {
  key?: string;
  shift?: boolean;
  ctrl?: boolean;
};

export default function useKeydownPress(callback: VoidFunction, { key, ctrl, shift }: KeyConfig = {}) {
  const keyMap = {
    shift: '⇧',
    ctrl: isMac() ? '⌘' : 'Ctrl'
  };

  useEffect(() => {
    function onKeydown(event: globalThis.KeyboardEvent) {
      if (key && event.key?.toLowerCase() !== key.toLowerCase()) {
        return;
      }

      if (shift && !event.shiftKey) {
        return;
      }

      const hasCtrlPressed = isMac() ? event.metaKey : event.ctrlKey;
      if (ctrl && !hasCtrlPressed) {
        return;
      }

      event.preventDefault();
      callback?.();
    }

    window.addEventListener('keydown', onKeydown);

    return () => window.removeEventListener('keydown', onKeydown);
  }, [key, ctrl, shift, callback]);

  const displayValue = useMemo(() => {
    const values: string[] = [];
    if (shift) {
      values.push(keyMap.shift);
    }

    if (ctrl) {
      values.push(keyMap.ctrl);
    }

    if (key) {
      values.push(key.toUpperCase());
    }

    return values.join(' + ');
  }, [shift, ctrl, key]);

  return displayValue;
}
