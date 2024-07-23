import { useColorScheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';

export function useDarkTheme() {
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // for server-side rendering
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && mode !== 'dark') {
      setMode('dark');
    }
  }, [mode, mounted, setMode]);
}
