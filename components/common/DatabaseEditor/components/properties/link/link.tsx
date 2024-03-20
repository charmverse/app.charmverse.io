import LinkIcon from '@mui/icons-material/Link';
import type { ReactNode } from 'react';
import React from 'react';

import { TextInput } from '../../../../../components/properties/TextInput';
import type { PropertyValueDisplayType } from '../../../interfaces';
import { Utils } from '../../../utils';

type Props = {
  value: string;
  readOnly?: boolean;
  placeholderText?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  validator: (newValue: string) => boolean;
  displayType?: PropertyValueDisplayType;
};

function URLProperty(props: Props): JSX.Element {
  let link: ReactNode = null;
  const hasValue = Boolean(props.value?.trim());
  if (hasValue) {
    link = (
      <a
        className={`Link__button ${props.displayType === 'table' ? 'table-cell' : ''}`}
        href={Utils.ensureProtocol(props.value.trim())}
        target='_blank'
        rel='noreferrer'
        onClick={(event) => event.stopPropagation()}
      >
        <LinkIcon fontSize='small' />
      </a>
    );
  }

  const commonProps = {
    placeholderText: props.placeholderText,
    readOnly: props.readOnly,
    value: props.value,
    autoExpand: false,
    onChange: props.onChange,
    multiline: props.multiline,
    onSave: props.onSave,
    onCancel: props.onCancel,
    validator: props.validator
  };

  return (
    <div className='URLProperty property-link url'>
      <TextInput {...commonProps} />
      {link}
    </div>
  );
}

export default URLProperty;
