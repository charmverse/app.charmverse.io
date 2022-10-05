
import LinkIcon from '@mui/icons-material/Link';
import type { ReactNode } from 'react';
import React from 'react';

import { Utils } from '../../../utils';
import Editable from '../../../widgets/editable';

type Props = {
    value: string;
    readOnly?: boolean;
    placeholder?: string;
    onChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
    validator: (newValue: string) => boolean;
}

function URLProperty (props: Props): JSX.Element {
  let link: ReactNode = null;
  const hasValue = Boolean(props.value?.trim());
  if (hasValue) {
    link = (
      <a
        className='Link__button'
        href={Utils.ensureProtocol(props.value.trim())}
        target='_blank'
        rel='noreferrer'
        onClick={(event) => event.stopPropagation()}
      >
        <LinkIcon fontSize='small' />
      </a>
    );
  }
  return (
    <div className='URLProperty property-link url'>
      {(hasValue || props.placeholder)
        && (
          <Editable
            className='octo-propertyvalue'
            placeholderText={props.placeholder}
            value={props.value}
            autoExpand={false}
            readOnly={props.readOnly}
            onChange={props.onChange}
            onSave={props.onSave}
            onCancel={props.onCancel}
            validator={props.validator}
          />
        )}
      {link}
    </div>
  );
}

export default URLProperty;
