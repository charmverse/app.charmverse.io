import type { ProposalStatus } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { memo, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import charmClient from 'charmClient';
import { EmptyPlaceholder } from 'components/common/BoardEditor/components/properties/EmptyPlaceholder';
import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { UserSelect } from 'components/common/BoardEditor/components/properties/UserSelect';
import type { PropertyValueDisplayType } from 'components/common/BoardEditor/interfaces';
import { ProposalStatusChipTextOnly } from 'components/proposals/components/ProposalStatusBadge';
import { useProposalsWhereUserIsEvaluator } from 'components/proposals/hooks/useProposalsWhereUserIsEvaluator';
import { useDateFormatter } from 'hooks/useDateFormatter';
import type { Board, DatabaseProposalPropertyType, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import { proposalPropertyTypesList } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';
import { STATUS_BLOCK_ID } from 'lib/proposal/blocks/constants';
import { getAbsolutePath } from 'lib/utilities/browser';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import { TextInput } from '../../../components/properties/TextInput';
import type { Mutator } from '../mutator';
import defaultMutator from '../mutator';
import { OctoUtils } from '../octoUtils';
import Switch from '../widgets/switch';

import CreatedAt from './properties/createdAt/createdAt';
import CreatedBy from './properties/createdBy/createdBy';
import DateRange from './properties/dateRange/dateRange';
import LastModifiedAt from './properties/lastModifiedAt/lastModifiedAt';
import LastModifiedBy from './properties/lastModifiedBy/lastModifiedBy';
import URLProperty from './properties/link/link';

type Props = {
  board: Board;
  readOnly: boolean;
  card: Card;
  syncWithPageId?: string | null;
  updatedBy: string;
  updatedAt: string;
  propertyTemplate: IPropertyTemplate;
  showEmptyPlaceholder: boolean;
  displayType?: PropertyValueDisplayType;
  showTooltip?: boolean;
  wrapColumn?: boolean;
  columnRef?: React.RefObject<HTMLDivElement>;
  mutator?: Mutator;
};

/**
 * Hide these values if user is not an evalutor for the proposal
 */
const hiddenProposalEvaluatorPropertyValues: DatabaseProposalPropertyType[] = [
  'proposalEvaluationAverage',
  'proposalEvaluatedBy',
  'proposalEvaluationTotal'
];

function PropertyValueElement(props: Props) {
  const [value, setValue] = useState(props.card.fields.properties[props.propertyTemplate.id] || '');
  const [serverValue, setServerValue] = useState(props.card.fields.properties[props.propertyTemplate.id] || '');
  const { formatDateTime, formatDate } = useDateFormatter();
  const {
    card,
    syncWithPageId,
    propertyTemplate,
    readOnly,
    showEmptyPlaceholder,
    board,
    updatedBy,
    updatedAt,
    displayType,
    mutator = defaultMutator
  } = props;

  const { rubricProposalIdsWhereUserIsEvaluator, rubricProposalIdsWhereUserIsNotEvaluator } =
    useProposalsWhereUserIsEvaluator({
      spaceId:
        !!board && hiddenProposalEvaluatorPropertyValues.includes(propertyTemplate?.type as any)
          ? board.spaceId
          : undefined
    });

  const intl = useIntl();
  const propertyValue = card.fields.properties[propertyTemplate.id];
  const displayValue = OctoUtils.propertyDisplayValue({
    block: card,
    propertyValue,
    propertyTemplate,
    formatters: {
      date: formatDate,
      dateTime: formatDateTime
    }
  });
  const emptyDisplayValue = showEmptyPlaceholder
    ? intl.formatMessage({ id: 'PropertyValueElement.empty', defaultMessage: 'Empty' })
    : '';
  const router = useRouter();
  const domain = router.query.domain as string;

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

  let propertyValueElement: ReactNode = null;

  if (propertyTemplate.type === 'proposalStatus' || propertyTemplate.id === STATUS_BLOCK_ID) {
    // Proposals as datasource use proposalStatus column, whereas the actual proposals table uses STATUS_BLOCK_ID
    // We should migrate over the proposals as datasource blocks to the same format as proposals table
    return (
      <ProposalStatusChipTextOnly
        status={
          (stringUtils.isUUID(propertyValue as string)
            ? propertyTemplate.options.find((opt) => opt.id === propertyValue)?.value
            : propertyValue) as ProposalStatus
        }
      />
    );
  } else if (
    propertyTemplate.type === 'select' ||
    propertyTemplate.type === 'multiSelect' ||
    propertyTemplate.type === 'proposalCategory' ||
    propertyTemplate.type === 'proposalEvaluationType'
  ) {
    propertyValueElement = (
      <TagSelect
        data-test='closed-select-input'
        canEditOptions={!readOnly && !proposalPropertyTypesList.includes(propertyTemplate.type as any)}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn ?? false}
        multiselect={propertyTemplate.type === 'multiSelect'}
        readOnly={readOnly || proposalPropertyTypesList.includes(propertyTemplate.type as any)}
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
  } else if (
    propertyTemplate.type === 'person' ||
    propertyTemplate.type === 'proposalEvaluatedBy' ||
    propertyTemplate.type === 'proposalAuthor' ||
    propertyTemplate.type === 'proposalReviewer'
  ) {
    propertyValueElement = (
      <UserSelect
        displayType={displayType}
        memberIds={typeof propertyValue === 'string' ? [propertyValue] : (propertyValue as string[]) ?? []}
        readOnly={
          readOnly ||
          (displayType !== 'details' && displayType !== 'table') ||
          proposalPropertyTypesList.includes(propertyTemplate.type as any)
        }
        onChange={(newValue) => {
          mutator.changePropertyValue(card, propertyTemplate.id, newValue);
          const previousValue = propertyValue
            ? typeof propertyValue === 'string'
              ? [propertyValue]
              : (propertyValue as string[])
            : [];
          const newUserIds = newValue.filter((id) => !previousValue.includes(id));
          Promise.all(
            newUserIds.map((userId) =>
              charmClient.createEvent({
                spaceId: board.spaceId,
                payload: {
                  cardId: card.id,
                  cardProperty: {
                    id: propertyTemplate.id,
                    name: propertyTemplate.name,
                    value: userId
                  },
                  scope: WebhookEventNames.CardPersonPropertyAssigned
                }
              })
            )
          );
        }}
        wrapColumn={props.wrapColumn ?? false}
        showEmptyPlaceholder={showEmptyPlaceholder}
      />
    );
  } else if (propertyTemplate.type === 'date') {
    if (readOnly) {
      propertyValueElement = <div className='octo-propertyvalue'>{displayValue}</div>;
    } else {
      propertyValueElement = (
        <DateRange
          wrapColumn={props.wrapColumn}
          className='octo-propertyvalue'
          value={value.toString()}
          showEmptyPlaceholder={showEmptyPlaceholder}
          onChange={(newValue) => {
            mutator.changePropertyValue(card, propertyTemplate.id, newValue);
          }}
        />
      );
    }
  } else if (propertyTemplate.type === 'checkbox') {
    propertyValueElement = (
      <Switch
        isOn={propertyValue === 'true'}
        onChanged={(newBool) => {
          const newValue = newBool ? 'true' : '';
          mutator.changePropertyValue(card, propertyTemplate.id, newValue);
        }}
        readOnly={readOnly}
      />
    );
  } else if (propertyTemplate.type === 'createdBy') {
    propertyValueElement = <CreatedBy userId={card.createdBy} />;
  } else if (propertyTemplate.type === 'updatedBy') {
    propertyValueElement = <LastModifiedBy updatedBy={latestUpdated === 'card' ? card.updatedBy : updatedBy} />;
  } else if (propertyTemplate.type === 'createdTime') {
    propertyValueElement = <CreatedAt createdAt={card.createdAt} />;
  } else if (propertyTemplate.type === 'updatedTime') {
    propertyValueElement = (
      <LastModifiedAt updatedAt={new Date(latestUpdated === 'card' ? card.updatedAt : updatedAt).toString()} />
    );
  }

  const commonProps = {
    className: 'octo-propertyvalue',
    placeholderText: emptyDisplayValue,
    readOnly: props.readOnly || proposalPropertyTypesList.includes(propertyTemplate.type as any),
    value: value.toString(),
    autoExpand: true,
    onChange: setValue,
    displayType,
    multiline: displayType === 'details' ? true : props.wrapColumn ?? false,
    onSave: () => {
      mutator.changePropertyValue(card, propertyTemplate.id, value);
    },
    onCancel: () => setValue(propertyValue || ''),
    validator: (newValue: string) => validateProp(propertyTemplate.type, newValue),
    spellCheck: propertyTemplate.type === 'text',
    wrapColumn: props.wrapColumn ?? false,
    columnRef: props.columnRef
  };

  if (editableFields.includes(propertyTemplate.type)) {
    if (propertyTemplate.type === 'url') {
      propertyValueElement = <URLProperty {...commonProps} />;
    } else {
      propertyValueElement = <TextInput {...commonProps} />;
    }
  } else if (propertyTemplate.type === 'proposalUrl' && typeof displayValue === 'string') {
    const proposalUrl = getAbsolutePath(`/${propertyValue as string}`, domain);
    propertyValueElement = (
      <div data-test='property-proposal-url'>
        <URLProperty {...commonProps} value={proposalUrl} validator={() => true} />
      </div>
    );
  } else if (propertyValueElement === null) {
    propertyValueElement = (
      <div className='octo-propertyvalue'>
        {displayValue || (showEmptyPlaceholder && <EmptyPlaceholder>{emptyDisplayValue}</EmptyPlaceholder>)}
      </div>
    );
  }

  const hasCardValue = ['createdBy', 'updatedBy', 'createdTime', 'updatedTime'].includes(propertyTemplate.type);
  const hasArrayValue = Array.isArray(value) && value.length > 0;
  const hasStringValue = !Array.isArray(value) && !!value;
  const hasValue = hasCardValue || hasArrayValue || hasStringValue;
  if (!hasValue && props.readOnly && displayType !== 'details') {
    return null;
  }

  // Explicitly hide the value for this proposal
  if (hiddenProposalEvaluatorPropertyValues.includes(propertyTemplate?.type as any)) {
    if (syncWithPageId && !!rubricProposalIdsWhereUserIsNotEvaluator[syncWithPageId]) {
      return <EmptyPlaceholder>Hidden</EmptyPlaceholder>;
    } else if (syncWithPageId && !!rubricProposalIdsWhereUserIsEvaluator[syncWithPageId]) {
      return propertyValueElement;
    } else {
      return null;
    }
  }
  if (props.showTooltip) {
    return (
      <Tooltip title={props.propertyTemplate.name}>
        <div style={{ width: '100%' }}>{propertyValueElement}</div>
      </Tooltip>
    );
  }
  return propertyValueElement;
}

export default memo(PropertyValueElement);
