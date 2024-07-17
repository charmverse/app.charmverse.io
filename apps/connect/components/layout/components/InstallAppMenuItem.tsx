import { MenuItem } from '@mui/material';
import type { ReactNode } from 'react';

import { useAddToHomescreenPrompt } from 'hooks/useAddToHomeScreenPrompt';

export function InstallAppMenuItem({ children }: { children: ReactNode }) {
  const { prompt, promptToInstall, isPwaInstalled } = useAddToHomescreenPrompt();

  if (!prompt || isPwaInstalled) {
    return null;
  }

  return <MenuItem onClick={promptToInstall}>{children}</MenuItem>;
}
