import { useEffect, useState } from 'react';

// Add a prefix so if our schema changes, we can invalidate previous content
const PREFIX = 'charm.v1';

// localStorage hook inspiration: https://blog.logrocket.com/using-localstorage-react-hooks/

export function getStorageValue<T = any> (key: string, defaultValue: T, noPrefix?: boolean): T {

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(getKey(key, noPrefix));

    if (typeof saved === 'string') {
      try {
        return JSON.parse(saved);
      }
      catch (error) {
        return defaultValue;
      }
    }
  }
  return defaultValue;
}

export function setStorageValue<T = any> (key: string, value: T, noPrefix?: boolean): T {
  localStorage.setItem(getKey(key, noPrefix), JSON.stringify(value));
  return value;
}

export function useLocalStorage<T = any> (key: string, defaultValue: T, noPrefix?: boolean) {
  const [value, setValue] = useState<T>(() => {
    return getStorageValue(key, defaultValue, noPrefix);
  });

  // Any time the key changes we need to get the value from ls again
  useEffect(() => {
    setValue(getStorageValue(key, defaultValue, noPrefix));
  }, [key]);

  useEffect(() => {
    setStorageValue(key, value, noPrefix);
  }, [key, value]);
  return [value, setValue] as const;
}

export function getKey (key: string, noPrefix?: boolean) {
  return noPrefix ? key : `${PREFIX}.${key}`;
}
