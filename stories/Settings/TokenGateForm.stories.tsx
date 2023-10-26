import { useTheme } from '@emotion/react';

import { LitShareModal } from 'components/common/LitProtocolModal';

export default {
  title: 'Settings/Components',
  component: TokenGateForm
};

export function TokenGateForm() {
  const theme = useTheme();

  function onSubmit(conditions: any) {
    // console.log('Conditions, conditions', conditions);
  }

  return <LitShareModal darkMode={theme.palette.mode === 'dark'} onUnifiedAccessControlConditionsSelected={onSubmit} />;
}
