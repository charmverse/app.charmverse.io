import type { ChangeEvent } from 'react';
import { useRef } from 'react';

export function useFilePicker (onFile: (file: File) => void) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    event.preventDefault();

    const file = event.target.files?.[0];
    if (file) {
      onFile(file);
    }

    event.target.value = '';
  };

  return { inputRef, openFilePicker, onFileChange };
}
