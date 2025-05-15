import LinkIcon from '@mui/icons-material/Link';
import type { PropertyValueDisplayType } from '@packages/databases/interfaces';
import { Utils } from '@packages/databases/utils';
import type { ReactNode } from 'react';
import React from 'react';

import { TextInput } from '../TextInput';

type Props = {
  value: string | string[]; // [url, label]
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
  const valueArray = Array.isArray(props.value) ? props.value : [props.value];
  const src = valueArray[0]?.trim();
  const label = valueArray[1] || src;
  const hasValue = Boolean(src);

  if (hasValue) {
    link = (
      <a
        className={`Link__button ${props.displayType === 'table' ? 'table-cell' : ''}`}
        href={Utils.ensureProtocol(src)}
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
    value: label,
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
