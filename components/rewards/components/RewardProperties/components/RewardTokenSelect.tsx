import { SelectPreviewContainer } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { StyledUserPropertyContainer } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import type { IInputSearchCryptoProps } from 'components/common/form/InputSearchCrypto';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';

export function RewardTokenSelect({ chainId, readOnly, ...props }: IInputSearchCryptoProps) {
  return (
    <SelectPreviewContainer readOnly={readOnly} displayType='details'>
      <StyledUserPropertyContainer>
        <InputSearchCrypto
          readOnly={readOnly}
          chainId={chainId}
          {...props}
          variant='standard'
          placeholder={chainId ? 'Empty' : 'Select chain'}
        />
      </StyledUserPropertyContainer>
    </SelectPreviewContainer>
  );
}
