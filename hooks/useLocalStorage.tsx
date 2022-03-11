import { useState, useEffect } from 'react';

// Add a prefix so if our schema changes, we can invalidate previous content
const PREFIX = 'charm.v1';

// localStorage hook inspiration: https://blog.logrocket.com/using-localstorage-react-hooks/

export function getStorageValue<T = any> (key: string, defaultValue: T): T {

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(getKey(key));

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

export function setStorageValue<T = any> (key: string, value: T): T {
  localStorage.setItem(getKey(key), JSON.stringify(value));
  return value;
}

export function useLocalStorage<T = any> (key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    return getStorageValue(key, defaultValue);
  });

  // Any time the key changes we need to get the value from ls again
  useEffect(() => {
    setValue(getStorageValue(key, defaultValue));
  }, [key]);

  useEffect(() => {
    setStorageValue(key, value);
  }, [key, value]);
  return [value, setValue] as const;
}

export function getKey (key: string) {
  return `${PREFIX}.${key}`;
}
