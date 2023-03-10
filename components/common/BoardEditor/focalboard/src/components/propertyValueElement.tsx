import { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';

import { SelectProperty } from 'components/common/BoardEditor/components/properties/SelectProperty/SelectProperty';
import type { PropertyValueDisplayType } from 'components/common/BoardEditor/interfaces';
import { useDateFormatter } from 'hooks/useDateFormatter';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';

import mutator from '../mutator';
import { OctoUtils } from '../octoUtils';
import Switch from '../widgets/switch';
import { TextInput } from '../widgets/TextInput';

import CreatedAt from './properties/createdAt/createdAt';
import CreatedBy from './properties/createdBy/createdBy';
import DateRange from './properties/dateRange/dateRange';
import LastModifiedAt from './properties/lastModifiedAt/lastModifiedAt';
import LastModifiedBy from './properties/lastModifiedBy/lastModifiedBy';
import URLProperty from './properties/link/link';
import UserProperty from './properties/user/user';

type Props = {
  board: Board;
  readOnly: boolean;
  card: Card;
  updatedBy: string;
  updatedAt: string;
  propertyTemplate: IPropertyTemplate;
  showEmptyPlaceholder: boolean;
  displayType?: PropertyValueDisplayType;
};

function PropertyValueElement(props: Props): JSX.Element {
  const [value, setValue] = useState(props.card.fields.properties[props.propertyTemplate.id] || '');
  const [serverValue, setServerValue] = useState(props.card.fields.properties[props.propertyTemplate.id] || '');
  const { formatDateTime, formatDate } = useDateFormatter();

  const { card, propertyTemplate, readOnly, showEmptyPlaceholder, board, updatedBy, updatedAt, displayType } = props;
  const intl = useIntl();
  const propertyValue = card.fields.properties[propertyTemplate.id];
  const displayValue = OctoUtils.propertyDisplayValue(card, propertyValue, propertyTemplate, {
    date: formatDate,
    dateTime: formatDateTime
  });
  const emptyDisplayValue = showEmptyPlaceholder
    ? intl.formatMessage({ id: 'PropertyValueElement.empty', defaultMessage: 'Empty' })
    : '';

  const finalDisplayValue = displayValue || emptyDisplayValue;

  const editableFields: PropertyType[] = ['text', 'number', 'email', 'url', 'phone'];
  const latestUpdated = new Date(updatedAt).getTime() > new Date(card.updatedAt).getTime() ? 'page' : 'card';

  useEffect(() => {
    if (serverValue === value) {
      setValue(props.card.fields.properties[props.propertyTemplate.id] || '');
    }
    setServerValue(props.card.fields.properties[props.propertyTemplate.id] || '');
  }, [value, props.card.fields.properties[props.propertyTemplate.id]]);

  const validateProp = (propType: string, val: string): boolean => {
    if (val === '') {
      return true;
    }
    switch (propType) {
      case 'number':
        return !Number.isNaN(parseInt(val, 10));
      case 'email': {
        const emailRegexp =
          // eslint-disable-next-line max-len
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{"mixer na 8 chainach1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return emailRegexp.test(val);
      }
      case 'url': {
        const urlRegexp =
          // eslint-disable-next-line max-len
          /(((.+:(?:\/\/)?)?(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/;
        return urlRegexp.test(val);
      }
      case 'text':
        return true;
      case 'phone':
        return true;
      default:
        return false;
    }
  };

  if (propertyTemplate.type === 'select' || propertyTemplate.type === 'multiSelect') {
    return (
      <SelectProperty
        multiselect={propertyTemplate.type === 'multiSelect'}
        readOnly={readOnly || !board}
        propertyValue={propertyValue as string}
        options={propertyTemplate.options}
        onChange={(newValue) => {
          mutator.changePropertyValue(card, propertyTemplate.id, newValue);
        }}
        onUpdateOption={(option) => {
          mutator.changePropertyOption(board, propertyTemplate, option);
        }}
        onDeleteOption={(option) => {
          mutator.deletePropertyOption(board, propertyTemplate, option);
        }}
        onCreateOption={(newValue) => {
          mutator.insertPropertyOption(board, propertyTemplate, newValue, 'add property option');
        }}
        displayType={displayType}
      />
    );
  } else if (propertyTemplate.type === 'person') {
    return (
      <UserProperty
        memberIds={typeof propertyValue === 'string' ? [propertyValue] : propertyValue}
        readOnly={readOnly}
        onChange={(newValue) => {
          mutator.changePropertyValue(card, propertyTemplate.id, newValue);
        }}
        showEmptyPlaceholder={displayType === 'details'}
      />
    );
  } else if (propertyTemplate.type === 'date') {
    if (readOnly) {
      return <div className='octo-propertyvalue'>{displayValue}</div>;
    }
    return (
      <DateRange
        className='octo-propertyvalue'
        value={value.toString()}
        showEmptyPlaceholder={showEmptyPlaceholder}
        onChange={(newValue) => {
          mutator.changePropertyValue(card, propertyTemplate.id, newValue);
        }}
      />
    );
  } else if (propertyTemplate.type === 'url') {
    return (
      <URLProperty
        value={value.toString()}
        readOnly={readOnly}
        placeholder={emptyDisplayValue}
        onChange={setValue}
        onSave={() => {
          mutator.changePropertyValue(card, propertyTemplate.id, value);
        }}
        multiline={displayType === 'details'}
        onCancel={() => setValue(propertyValue || '')}
        validator={(newValue) => validateProp(propertyTemplate.type, newValue)}
      />
    );
  } else if (propertyTemplate.type === 'checkbox') {
    return (
      <Switch
        isOn={Boolean(propertyValue)}
        onChanged={(newBool) => {
          const newValue = newBool ? 'true' : '';
          mutator.changePropertyValue(card, propertyTemplate.id, newValue);
        }}
        readOnly={readOnly}
      />
    );
  } else if (propertyTemplate.type === 'createdBy') {
    return <CreatedBy userID={card.createdBy} />;
  } else if (propertyTemplate.type === 'updatedBy') {
    return <LastModifiedBy updatedBy={latestUpdated === 'card' ? card.updatedBy : updatedBy} />;
  } else if (propertyTemplate.type === 'createdTime') {
    return <CreatedAt createdAt={card.createdAt} />;
  } else if (propertyTemplate.type === 'updatedTime') {
    return <LastModifiedAt updatedAt={new Date(latestUpdated === 'card' ? card.updatedAt : updatedAt).toString()} />;
  }

  if (editableFields.includes(propertyTemplate.type)) {
    return (
      <TextInput
        className='octo-propertyvalue'
        placeholderText={emptyDisplayValue}
        readOnly={readOnly}
        value={value.toString()}
        autoExpand={false}
        onChange={setValue}
        multiline={true}
        maxRows={displayType === 'details' ? undefined : 1}
        onSave={() => {
          mutator.changePropertyValue(card, propertyTemplate.id, value);
        }}
        onCancel={() => setValue(propertyValue || '')}
        validator={(newValue) => validateProp(propertyTemplate.type, newValue)}
        spellCheck={propertyTemplate.type === 'text'}
      />
    );
  }
  return <div className='octo-propertyvalue'>{finalDisplayValue}</div>;
}

export default PropertyValueElement;
