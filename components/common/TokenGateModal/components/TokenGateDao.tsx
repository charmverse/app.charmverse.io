import { yupResolver } from '@hookform/resolvers/yup';
import { ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import { litDaoChains } from 'connectors/chains';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { TextInputField } from 'components/common/form/fields/TextInputField';
import TokenLogo from 'components/common/TokenLogo';
import { isValidChainAddress } from 'lib/tokens/validation';

import { useTokenGateModal } from '../hooks/useTokenGateModalContext';
import { getDaoUnifiedAccessControlConditions } from '../utils/getDaoUnifiedAccessControlConditions';

import { TokenGateBlockchainSelect } from './TokenGateBlockchainSelect';
import { TokenGateFooter } from './TokenGateFooter';

const schema = yup.object({
  chain: yup.string().required('Chain is required'),
  contract: yup
    .string()
    .required('Contract is required')
    .test('isAddress', 'Invalid address', (value) => isValidChainAddress(value))
});

export type FormValues = yup.InferType<typeof schema>;

export function TokenGateDao() {
  const {
    register,
    getValues,
    reset,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: { contract: '', chain: '' }
  });

  const { setDisplayedPage, handleUnifiedAccessControlConditions } = useTokenGateModal();

  const onSubmit = async () => {
    const values = getValues();
    const valueProps = getDaoUnifiedAccessControlConditions(values) || [];
    handleUnifiedAccessControlConditions(valueProps);
    setDisplayedPage('review');
  };

  const onCancel = () => {
    setDisplayedPage('home');
    reset();
  };

  return (
    <>
      <TokenGateBlockchainSelect
        error={!!errors.chain?.message}
        helperMessage={errors.chain?.message}
        {...register('chain')}
      >
        {litDaoChains.map((_chain) => (
          <MenuItem key={_chain.litNetwork} value={_chain.chainName}>
            <ListItemIcon>
              <TokenLogo height={20} src={_chain.iconUrl} />
            </ListItemIcon>
            <ListItemText>{_chain.chainName}</ListItemText>
          </MenuItem>
        ))}
      </TokenGateBlockchainSelect>
      <TextInputField
        label='DAO Contract Address'
        error={errors.contract?.message}
        helperText={errors.contract?.message}
        {...register('contract')}
      />
      <TokenGateFooter onSubmit={onSubmit} onCancel={onCancel} isValid={isValid} />
    </>
  );
}
