import type { IInputSearchCryptoProps } from 'components/common/form/InputSearchCrypto';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';

export function RewardTokenSelect({ chainId, readOnly, ...props }: IInputSearchCryptoProps) {
  return <InputSearchCrypto readOnly={readOnly} chainId={chainId} {...props} placeholder='Empty' />;
}
