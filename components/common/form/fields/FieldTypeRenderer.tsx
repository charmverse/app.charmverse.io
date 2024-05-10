import { Box, type SxProps } from '@mui/material';
import { debounce } from 'lodash';
import { forwardRef, useMemo } from 'react';

import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import { SelectField } from 'components/common/form/fields/SelectField';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';
import { AttachRewardButton } from 'components/proposals/ProposalPage/components/ProposalProperties/components/ProposalRewards/AttachRewardButton';
import type { ProposalRewardsTableProps } from 'components/proposals/ProposalPage/components/ProposalProperties/components/ProposalRewards/ProposalRewardsTable';
import { ProposalRewardsTable } from 'components/proposals/ProposalPage/components/ProposalProperties/components/ProposalRewards/ProposalRewardsTable';
import type { UploadedFileInfo } from 'hooks/useS3UploadInput';
import type { FormFieldValue, FieldType } from 'lib/forms/interfaces';

import { InputSearchBlockchain } from '../InputSearchBlockchain';

import { CharmEditorInputField } from './CharmEditorInputField';
import { DateInputField } from './DateInputField';
import { FieldWrapper } from './FieldWrapper';
import { FileField } from './FileField';
import { ImageField } from './ImageField';
import { LabelField } from './LabelField';
import { PersonInputField } from './PersonInputField';

type TextInputConfig = {
  rows?: number;
  maxRows?: number;
};

type WalletInputConfig = {
  chainId?: number;
  onChangeChainId?: (chainId: number | null) => void;
};

type TextProps = {
  type: Exclude<FieldType, 'select' | 'multiselect'>;
  rows?: number;
  maxRows?: number;
} & FieldProps &
  ControlFieldProps;

type SelectProps = {
  type: 'select' | 'multiselect';
} & FieldProps &
  Required<ControlFieldProps>;

type Props = (Omit<TextProps, 'type'> | Omit<SelectProps, 'type'>) & {
  sx?: SxProps;
  type: FieldType;
  textInputConfig?: TextInputConfig;
  walletInputConfig?: WalletInputConfig;
  milestoneProps?: ProposalRewardsTableProps;
  formFieldId?: string;
  onChangeDebounced?: (updatedValue: { id: string; value: FormFieldValue }) => void;
} & TextInputConfig;

export const FieldTypeRenderer = forwardRef<HTMLDivElement, Props>(
  (
    {
      type,
      options,
      walletInputConfig,
      onCreateOption,
      onDeleteOption,
      onUpdateOption,
      onChangeDebounced: _onChangeDebounced,
      formFieldId,
      ...fieldProps
    }: Props,
    ref
  ) => {
    const onChangeDebounced = useMemo(
      () => (_onChangeDebounced ? debounce(_onChangeDebounced, 300) : null),
      [_onChangeDebounced]
    );
    const _onChange = fieldProps.onChange;
    if (_onChange) {
      fieldProps.onChange = (e) => {
        _onChange(e);
        // currently only used by proposal forms
        if (formFieldId && onChangeDebounced) {
          onChangeDebounced({
            id: formFieldId,
            value: typeof e?.target?.value === 'string' ? e.target.value : e
          });
        }
      };
    }
    switch (type) {
      case 'text':
      case 'email':
      case 'url':
      case 'phone':
      case 'short_text': {
        return <TextInputField {...fieldProps} ref={ref} multiline />;
      }
      case 'wallet': {
        return (
          <TextInputField
            topComponent={
              walletInputConfig ? (
                <InputSearchBlockchain
                  disableClearable={false}
                  chainId={walletInputConfig.chainId}
                  readOnly={!walletInputConfig.onChangeChainId}
                  disabled={!walletInputConfig.onChangeChainId}
                  onChange={walletInputConfig.onChangeChainId}
                />
              ) : undefined
            }
            {...fieldProps}
            ref={ref}
            multiline
          />
        );
      }
      case 'milestone': {
        return (
          <FieldWrapper description={fieldProps.description} label={fieldProps.label} required={fieldProps.required}>
            {fieldProps.milestoneProps ? (
              <ProposalRewardsTable {...fieldProps.milestoneProps} variant='solid_button' />
            ) : (
              <Box>
                <AttachRewardButton disabled createNewReward={() => {}} variant='solid_button' />
              </Box>
            )}
          </FieldWrapper>
        );
      }
      case 'long_text': {
        return <CharmEditorInputField {...fieldProps} />;
      }
      case 'text_multiline': {
        return <TextInputField rows={3} {...fieldProps} ref={ref} multiline />;
      }
      case 'number': {
        return <NumberInputField {...fieldProps} fullWidth ref={ref} />;
      }

      case 'date': {
        return <DateInputField {...fieldProps} ref={ref} />;
      }

      case 'person': {
        return <PersonInputField {...fieldProps} ref={ref} />;
      }

      case 'label': {
        return <LabelField {...fieldProps} />;
      }

      case 'multiselect':
      case 'select': {
        return (
          <SelectField
            {...(fieldProps as SelectProps)}
            error={fieldProps.error || (options ?? []).length === 0 ? 'Atleast one option is required' : undefined}
            ref={ref}
            placeholder={(options ?? []).length === 0 ? 'Create an option' : fieldProps.placeholder}
            value={fieldProps.value as string[]}
            multiselect={type === 'multiselect'}
            options={options}
            onCreateOption={onCreateOption}
            onDeleteOption={onDeleteOption}
            onUpdateOption={onUpdateOption}
          />
        );
      }

      case 'image': {
        return <ImageField {...fieldProps} />;
      }

      case 'file': {
        return <FileField {...fieldProps} value={fieldProps.value as UploadedFileInfo} />;
      }

      default: {
        return null;
      }
    }
  }
);
