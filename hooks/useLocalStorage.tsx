import { useState, useEffect } from 'react';

// Add a prefix so if our schema changes, we can invalidate previous content
const PREFIX = 'charm.v1';

// localStorage hook inspiration: https://blog.logrocket.com/using-localstorage-react-hooks/

export function getStorageValue<T = any> (key: string, defaultValue?: T) {

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(key);
    if (typeof saved === 'string') {
      try {
        return JSON.parse(saved);
      }
      catch (error) {
        return defaultValue || null;
      }
    }
  }
  return defaultValue || null;
}

export function useLocalStorage<T = any> (_key: string, defaultValue?: T) {

  const key = getKey(_key);

  const [value, setValue] = useState<T>(() => {
    return getStorageValue(key, defaultValue);
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}

export function getKey (key: string) {
  return `${PREFIX}.${key}`;
}
