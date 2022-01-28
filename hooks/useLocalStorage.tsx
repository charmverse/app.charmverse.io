import { useState, useEffect } from 'react';

// localStorage hook inspiration: https://blog.logrocket.com/using-localstorage-react-hooks/

function getStorageValue<T = any> (key: string, defaultValue?: T) {
  // getting stored value
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(key);
    const initial = typeof saved === 'string' ? JSON.parse(saved) : saved;
    return initial || defaultValue;
  }
  return null;
}

export function useLocalStorage<T = any> (key: string, defaultValue?: T) {
  const [value, setValue] = useState<T>(() => {
    return getStorageValue(key, defaultValue);
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
};