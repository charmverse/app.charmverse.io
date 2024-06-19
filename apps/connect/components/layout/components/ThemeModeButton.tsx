import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import IconButton from '@mui/material/IconButton';
import { useColorScheme } from '@mui/material/styles';
import type { Mode } from '@mui/system/cssVars/useCurrentColorScheme';
import { useEffect, useState } from 'react';

export function ThemeModeButton() {
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMode = () => {
    if (mode === 'light') {
      setMode('dark');
    } else if (mode === 'dark') {
      setMode('light');
    } else {
      setMode('system');
    }
  };

  if (!mounted || !mode) {
    // for server-side rendering
    // learn more at https://github.com/pacocoursey/next-themes#avoid-hydration-mismatch
    return null;
  }

  return (
    <IconButton onClick={handleMode} sx={{ p: 0 }}>
      <ModeIcon mode={mode} />
    </IconButton>
  );
}

function ModeIcon({ mode }: { mode: Mode }) {
  if (mode === 'dark') {
    return <DarkModeIcon />;
  }
  if (mode === 'light') {
    return <LightModeIcon />;
  }

  return <SettingsBrightnessIcon />;
}
