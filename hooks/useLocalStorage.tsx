import { useState, useEffect } from 'react';

// Add a prefix so if our schema changes, we can invalidate previous content
const PREFIX = 'charm.v1';

// localStorage hook inspiration: https://blog.logrocket.com/using-localstorage-react-hooks/

function getStorageValue<T = any> (_key: string, defaultValue?: T) {

  if (typeof window !== 'undefined') {
    const key = getKey(_key);
    const saved = localStorage.getItem(key);
    const initial = typeof saved === 'string' ? JSON.parse(saved) : saved;
    return initial || defaultValue;
  }
  return null;
}

export function useLocalStorage<T = any> (_key: string, defaultValue?: T) {

  const key = getKey(_key);

  const [value, setValue] = useState<T>(() => {
    return getStorageValue(PREFIX + key, defaultValue);
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}

function getKey (key: string) {
  return `${PREFIX}.${key}`;
}