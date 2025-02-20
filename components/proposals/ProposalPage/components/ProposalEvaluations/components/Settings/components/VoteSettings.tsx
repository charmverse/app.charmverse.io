import type { PaymentMethod } from '@charmverse/core/prisma';
import { VoteStrategy, VoteType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import AddCircle from '@mui/icons-material/AddCircle';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {
  Divider,
  FormControlLabel,
  FormLabel,
  IconButton,
  ListItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { getChainById } from '@packages/connectors/chains';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

import { Button } from 'components/common/Button';
import { NumericFieldWithButtons } from 'components/common/form/fields/NumericFieldWithButtons';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import type { ProposalEvaluationInput } from 'lib/proposals/createProposal';
import { isTruthy } from 'lib/utils/types';

type CreateVoteModalProps = {
  readOnly?: boolean;
  onChange?: (vote: ProposalEvaluationInput['voteSettings']) => void;
  value: ProposalEvaluationInput['voteSettings'];
  isPublishedProposal?: boolean;
};

const StyledVoteSettings = styled.div`
  & .MuiInputBase-input {
    box-sizing: content-box;
  }
`;

export function VoteSettings({ isPublishedProposal, readOnly, value, onChange }: CreateVoteModalProps) {
  const [passThreshold, setPassThreshold] = useState<number>(value?.threshold || 50);
  // Default values for approval type vote
  const [voteType, setVoteType] = useState<VoteType>(value?.type ?? VoteType.Approval);
  const [options, setOptions] = useState<string[]>(value?.options ?? ['Yes', 'No', 'Abstain']);
  const [maxChoices, setMaxChoices] = useState(value?.maxChoices ?? 1);
  const [durationDays, setDurationDays] = useState(value?.durationDays ?? 5);
  const [voteStrategy, setVoteStrategy] = useState<VoteStrategy>(value?.strategy ?? 'regular');
  const [voteToken, setVoteToken] = useState<null | {
    chainId: number;
    tokenAddress: string;
  }>(
    value?.chainId && value?.tokenAddress && value?.strategy === 'token'
      ? {
          chainId: value.chainId,
          tokenAddress: value.tokenAddress
        }
      : null
  );
  const [paymentMethods] = usePaymentMethods({
    filterUSDCPaymentMethods: true,
    filterNativeTokens: true
  });

  const [availableCryptos, setAvailableCryptos] = useState<{ chainId: number; tokenAddress: string }[]>(
    paymentMethods.map((method) => {
      return {
        chainId: method.chainId,
        tokenAddress: method.contractAddress || ''
      };
    })
  );

  function refreshCryptoList(chainId: number, rewardToken?: string) {
    // Set the default chain currency
    const selectedChain = getChainById(chainId);

    if (selectedChain) {
      const nativeCurrency = selectedChain.nativeCurrency.symbol;

      const cryptosToDisplay = [nativeCurrency];

      const contractAddresses = paymentMethods
        .filter((method) => method.chainId === chainId)
        .map((method) => {
          return method.contractAddress;
        })
        .filter(isTruthy);
      cryptosToDisplay.push(...contractAddresses);

      setAvailableCryptos([
        ...availableCryptos,
        {
          chainId,
          tokenAddress: rewardToken || nativeCurrency
        }
      ]);
      setVoteToken({
        tokenAddress: rewardToken || nativeCurrency,
        chainId
      });
    }
    return selectedChain?.nativeCurrency.symbol;
  }

  async function onNewPaymentMethod(paymentMethod: PaymentMethod) {
    if (paymentMethod.contractAddress) {
      refreshCryptoList(paymentMethod.chainId, paymentMethod.contractAddress);
    }
  }

  // useEffect on the values to call onChange() doesnt seem ideal and triggers on the first load, but it works for now. TODO: use react-hook-form?
  useEffect(() => {
    if (onChange) {
      const hasError =
        passThreshold > 100 ||
        (voteType === VoteType.SingleChoice && options.some((option) => option.length === 0)) ||
        new Set(options).size !== options.length;

      if (!hasError) {
        onChange({
          threshold: passThreshold,
          type: voteType,
          options,
          maxChoices: voteType === VoteType.Approval ? 1 : maxChoices,
          durationDays,
          blockNumber: null,
          chainId: voteToken?.chainId ?? null,
          tokenAddress: voteToken?.tokenAddress ?? null,
          strategy: voteStrategy
        });
      }
    }
  }, [voteType, options, maxChoices, durationDays, voteToken, passThreshold, voteStrategy]);

  function handleVoteTypeChange(_voteType: VoteType) {
    if (_voteType !== value?.type) {
      setVoteType(_voteType);
      if (_voteType === VoteType.Approval) {
        setOptions(['Yes', 'No', 'Abstain']);
      } else if (_voteType === VoteType.SingleChoice) {
        setOptions(['Option 1', 'Option 2', 'Abstain']);
      }
    }
  }

  return (
    <StyledVoteSettings data-test='evaluation-vote-settings'>
      <RadioGroup value={voteStrategy}>
        <FormControlLabel
          disabled={readOnly || isPublishedProposal}
          control={<Radio size='small' />}
          value={VoteStrategy.regular}
          label='One account one vote'
          onChange={() => {
            setVoteStrategy('regular');
            setVoteToken(null);
          }}
        />
        <FormControlLabel
          disabled={readOnly || isPublishedProposal}
          control={<Radio size='small' />}
          value={VoteStrategy.token}
          label='Token voting'
          onChange={() => {
            setVoteStrategy('token');
          }}
        />
        <FormControlLabel
          disabled={readOnly || isPublishedProposal}
          control={<Radio size='small' />}
          value={VoteStrategy.snapshot}
          label='Publish to Snapshot'
          onChange={() => {
            setVoteStrategy('snapshot');
            setVoteToken(null);
          }}
        />
      </RadioGroup>
      <Divider sx={{ mt: 1, mb: 2 }} />
      {voteStrategy === 'token' || voteStrategy === 'regular' ? (
        <>
          {voteStrategy === 'token' ? (
            <>
              <Typography component='span' variant='subtitle1'>
                Token
              </Typography>
              <InputSearchCrypto
                disabled={readOnly || isPublishedProposal}
                readOnly={readOnly}
                cryptoList={availableCryptos}
                chainId={voteToken?.chainId}
                placeholder='Empty'
                value={voteToken ?? undefined}
                defaultValue={voteToken ?? undefined}
                onChange={setVoteToken}
                showChain
                key={`${voteToken?.chainId}.${voteToken?.tokenAddress}`}
                onNewPaymentMethod={(newPaymentMethod) => {
                  onNewPaymentMethod(newPaymentMethod).then(() => {
                    if (newPaymentMethod.contractAddress) {
                      setVoteToken({
                        chainId: newPaymentMethod.chainId,
                        tokenAddress: newPaymentMethod.contractAddress
                      });
                    }
                  });
                }}
                sx={{
                  width: '100%',
                  mb: 2
                }}
              />
            </>
          ) : null}
          <Stack
            data-test='vote-duration'
            direction='row'
            alignItems='center'
            gap={2}
            justifyContent='space-between'
            mb={1}
          >
            <FormLabel>
              <Typography component='span' variant='subtitle1'>
                Duration (days)
              </Typography>
            </FormLabel>
            <NumericFieldWithButtons
              disabled={readOnly}
              value={durationDays}
              onChange={setDurationDays}
              min={1}
              max={100}
            />
          </Stack>

          <FormLabel>
            <Typography component='span' variant='subtitle1'>
              Options
            </Typography>
          </FormLabel>
          <RadioGroup
            row
            defaultValue={voteType}
            value={voteType}
            onChange={(e) => {
              handleVoteTypeChange(e.target.value as VoteType);
            }}
            sx={{ mb: 1 }}
          >
            <FormControlLabel
              disabled={readOnly}
              value={VoteType.Approval}
              control={<Radio />}
              label='Yes / No / Abstain'
              data-test='vote-type-approval'
            />
            <FormControlLabel
              disabled={readOnly}
              value={VoteType.SingleChoice}
              control={<Radio />}
              data-test='vote-type-custom-options'
              label='Custom Options'
              sx={{ mr: 0 }}
            />
          </RadioGroup>
          {voteType === VoteType.SingleChoice && (
            <Stack mb={2}>
              <InlineVoteOptions options={options} setOptions={setOptions} />
              <Stack direction='row' alignItems='center' gap={2} mt={2} justifyContent='space-between'>
                <FormLabel>
                  <Typography component='span' variant='subtitle1'>
                    Max choices
                  </Typography>
                </FormLabel>
                <NumericFieldWithButtons disabled={readOnly} value={maxChoices} onChange={setMaxChoices} min={1} />
              </Stack>
            </Stack>
          )}

          {maxChoices === 1 && (
            <Stack
              data-test='vote-pass-threshold'
              direction='row'
              alignItems='center'
              gap={2}
              justifyContent='space-between'
              mb={2}
            >
              <FormLabel>
                <Typography component='span' variant='subtitle1'>
                  Pass Threshold (%)
                </Typography>
              </FormLabel>
              <NumericFieldWithButtons
                disabled={readOnly}
                value={passThreshold}
                onChange={setPassThreshold}
                max={100}
              />
            </Stack>
          )}
        </>
      ) : null}
    </StyledVoteSettings>
  );
}

interface InlineVoteOptionsProps {
  options: string[];
  setOptions: Dispatch<SetStateAction<string[]>>;
}

function InlineVoteOptions({ options, setOptions }: InlineVoteOptionsProps) {
  return (
    <div>
      {options.map((option, index) => {
        return (
          <ListItem
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            sx={{ px: 0, pt: 0, display: 'flex', gap: 0.5 }}
          >
            <TextField
              // Disable changing text for No change option
              data-test='inline-vote-option'
              fullWidth
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => {
                options[index] = e.target.value;
                setOptions([...options]);
              }}
            />
            <Tooltip arrow placement='top' title={index < 2 ? 'At least two options are required' : ''}>
              <div>
                <IconButton
                  disabled={options.length <= 2}
                  size='small'
                  data-test='delete-vote-option'
                  onClick={() => {
                    setOptions([...options.slice(0, index), ...options.slice(index + 1)]);
                  }}
                >
                  <DeleteOutlinedIcon fontSize='small' />
                </IconButton>
              </div>
            </Tooltip>
          </ListItem>
        );
      })}
      <Stack flex={1}>
        <Button
          sx={{ mr: 4 }}
          variant='outlined'
          color='secondary'
          size='small'
          data-test='add-vote-option'
          onClick={() => {
            setOptions([...options, '']);
          }}
        >
          <AddCircle fontSize='small' sx={{ mr: 1 }} />
          <Typography variant='subtitle1'>Add Option</Typography>
        </Button>
      </Stack>
    </div>
  );
}
