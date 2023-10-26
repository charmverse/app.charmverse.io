import { LitShareModal } from 'components/common/LitProtocolModal';

export default {
  title: 'Settings/Components',
  component: TokenGateForm
};

export function TokenGateForm() {
  function onSubmit(conditions: any) {
    // console.log('Conditions, conditions', conditions);
  }

  return <LitShareModal onUnifiedAccessControlConditionsSelected={onSubmit} />;
}
