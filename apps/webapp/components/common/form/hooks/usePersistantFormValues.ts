import { useEffect } from 'react';
import type { FieldValues, Path, PathValue, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { getStorageValue, setStorageValue } from 'hooks/useSessionStorage';

export function usePersistentFormValues<T extends FieldValues = FieldValues>(
  name: string,
  key: Path<T>,
  { watch, setValue }: { watch: UseFormWatch<T>; setValue: UseFormSetValue<T> }
) {
  useEffect(() => {
    const storage = getStorageValue<PathValue<T, Path<T>> | null>(name, null);

    if (storage) {
      setValue(key, storage);
    }
  }, [key, name]);

  useEffect(() => {
    const { unsubscribe } = watch((values) => {
      if (values[key]) {
        setStorageValue<T>(name, values[key]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [key, name]);
}
