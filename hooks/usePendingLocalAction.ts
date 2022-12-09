import { useLocalStorage } from 'hooks/useLocalStorage';

export function usePendingLocalAction(actionKey: string, validityTime = 5000) {
  const [value, setValue] = useLocalStorage<null | number>(actionKey, null);

  let isPendingAction = false;
  if (value) {
    isPendingAction = Date.now() - value < validityTime;

    if (!isPendingAction) {
      // If the action is expired, we remove it from the local storage.
      setValue(null);
    }
  }

  return {
    isPendingAction,
    setPendingAction: () => setValue(Date.now()),
    clearPendingAction: () => setValue(null)
  };
}
