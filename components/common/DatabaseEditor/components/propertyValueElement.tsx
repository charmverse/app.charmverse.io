import { log } from '@charmverse/core/log';
import type { ApplicationStatus, ProposalSystemRole } from '@charmverse/core/prisma';
import PersonIcon from '@mui/icons-material/Person';
import { Box, Stack } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import type { ReactElement, ReactNode } from 'react';
import { memo, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import { useSyncRelationPropertyValue } from 'charmClient/hooks/blocks';
import { useUpdateProposalEvaluation } from 'charmClient/hooks/proposals';
import type { SelectOption } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { ProposalStatusSelect } from 'components/proposals/components/ProposalStatusSelect';
import { ProposalStepSelect } from 'components/proposals/components/ProposalStepSelect';
import {
  REWARD_APPLICATION_STATUS_LABELS,
  RewardApplicationStatusChip
} from 'components/rewards/components/RewardApplicationStatusChip';
import { RewardStatusChip } from 'components/rewards/components/RewardChip';
import { RewardTokenDialog } from 'components/rewards/components/RewardProperties/components/RewardTokenDialog';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { allMembersSystemRole, authorSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/databases/board';
import type { CardWithRelations } from 'lib/databases/card';
import {
  EVALUATION_STATUS_LABELS,
  PROPOSAL_STEP_LABELS,
  proposalStatusColors
} from 'lib/databases/proposalDbProperties';
import type { OpProjectFieldValue } from 'lib/forms/interfaces';
import { PROPOSAL_STATUS_BLOCK_ID, PROPOSAL_STEP_BLOCK_ID } from 'lib/proposals/blocks/constants';
import type { ProposalReviewerProperty } from 'lib/proposals/blocks/interfaces';
import { getProposalEvaluationStatus } from 'lib/proposals/getProposalEvaluationStatus';
import type { ProposalEvaluationResultExtended, ProposalEvaluationStep } from 'lib/proposals/interfaces';
import {
  APPLICANT_STATUS_BLOCK_ID,
  DUE_DATE_ID,
  REWARDS_APPLICANTS_BLOCK_ID,
  REWARDS_AVAILABLE_BLOCK_ID,
  REWARD_AMOUNT,
  REWARD_APPLICANTS_COUNT,
  REWARD_CHAIN,
  REWARD_CUSTOM_VALUE,
  REWARD_PROPOSAL_LINK,
  REWARD_REVIEWERS_BLOCK_ID,
  REWARD_STATUS_BLOCK_ID,
  REWARD_TOKEN
} from 'lib/rewards/blocks/constants';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { RewardReviewer, RewardStatus } from 'lib/rewards/interfaces';
import { getAbsolutePath } from 'lib/utils/browser';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import type { PropertyValueDisplayType } from '../interfaces';
import type { Mutator } from '../mutator';
import defaultMutator from '../mutator';
import { OctoUtils } from '../octoUtils';
import Checkbox from '../widgets/checkbox';

import CreatedAt from './properties/createdAt/createdAt';
import CreatedBy from './properties/createdBy/createdBy';
import DateRange from './properties/dateRange/dateRange';
import { EmptyPlaceholder } from './properties/EmptyPlaceholder';
import LastModifiedAt from './properties/lastModifiedAt/lastModifiedAt';
import LastModifiedBy from './properties/lastModifiedBy/lastModifiedBy';
import URLProperty from './properties/link/link';
import { OptimismProjectLink } from './properties/OptimismProjectLink';
import { ProposalNotesLink } from './properties/ProposalNotesLink';
import { RelationPropertyPagesAutocomplete } from './properties/RelationPropertyPagesAutocomplete';
import { RewardsDueDatePicker } from './properties/RewardsDueDatePicker';
import { TagSelect } from './properties/TagSelect/TagSelect';
import { TextInput } from './properties/TextInput';
import { TokenAmount } from './properties/tokenAmount/tokenAmount';
import { TokenChain } from './properties/tokenChain/tokenChain';
import { UserAndRoleSelect } from './properties/UserAndRoleSelect';
import { UserSelect } from './properties/UserSelect';

type Props = {
  board: Board;
  readOnly: boolean;
  card: CardWithRelations;
  updatedBy: string;
  updatedAt: string;
  propertyTemplate: IPropertyTemplate;
  showEmptyPlaceholder: boolean;
  displayType?: PropertyValueDisplayType;
  showTooltip?: boolean;
  wrapColumn?: boolean;
  columnRef?: React.RefObject<HTMLDivElement>;
  mutator?: Mutator;
  subRowsEmptyValueContent?: ReactElement | string;
  showCard?: (cardId: string | null) => void;
  disableEditPropertyOption?: boolean;
};

export const validatePropertyValue = (propType: string, val: string): boolean => {
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

/**
 * Hide these values if user is not an evalutor for the proposal
 */

const editableFields: PropertyType[] = ['text', 'number', 'email', 'url', 'phone'];

function PropertyValueElement(props: Props) {
  const [value, setValue] = useState(props.card.fields.properties[props.propertyTemplate.id] || '');
  const [serverValue, setServerValue] = useState(props.card.fields.properties[props.propertyTemplate.id] || '');

  const { formatDateTime, formatDate } = useDateFormatter();
  const { updateReward } = useRewards();
  const { showError } = useSnackbar();
  const {
    card,
    propertyTemplate,
    showEmptyPlaceholder,
    board,
    updatedBy,
    updatedAt,
    displayType,
    mutator = defaultMutator,
    subRowsEmptyValueContent,
    disableEditPropertyOption
  } = props;
  const { proposal, reward } = card;
  const { trigger } = useUpdateProposalEvaluation({ proposalId: proposal?.id });
  const { trigger: syncRelationPropertyValue } = useSyncRelationPropertyValue();

  const isAdmin = useIsAdmin();
  const intl = useIntl();
  const propertyValue = card.fields.properties[propertyTemplate.id];
  const cardProperties = board.fields.cardProperties;
  const cardProperty = cardProperties.find((_cardProperty) => _cardProperty.id === propertyTemplate.id);
  const readOnly = proposal?.archived || props.readOnly || !!cardProperty?.readOnlyValues;
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
  const showUnlimited =
    propertyTemplate.id === REWARDS_AVAILABLE_BLOCK_ID && value.toString() === '' ? 'Unlimited' : '';
  const router = useRouter();
  const domain = router.query.domain as string;
  const latestUpdated = new Date(updatedAt).getTime() > new Date(card.updatedAt).getTime() ? 'page' : 'card';

  const commonProps = {
    className: 'octo-propertyvalue',
    placeholderText: emptyDisplayValue || showUnlimited,
    readOnly,
    value: value.toString(),
    autoExpand: true,
    onChange: setValue,
    displayType,
    multiline: displayType === 'details' ? true : (props.wrapColumn ?? false),
    onSave: async () => {
      try {
        await mutator.changePropertyValue(card, propertyTemplate.id, value);
      } catch (error) {
        showError(error);
      }
    },
    onCancel: () => setValue(propertyValue || ''),
    validator: (newValue: string) => validatePropertyValue(propertyTemplate.type, newValue),
    spellCheck: propertyTemplate.type === 'text',
    wrapColumn: props.wrapColumn ?? false,
    columnRef: props.columnRef
  };

  useEffect(() => {
    if (serverValue === value) {
      setValue(props.card.fields.properties[props.propertyTemplate.id] || '');
    }
    setServerValue(props.card.fields.properties[props.propertyTemplate.id] || '');
  }, [value, props.card.fields.properties[props.propertyTemplate.id]]);

  let propertyValueElement: ReactNode = null;

  if (propertyTemplate.id === DUE_DATE_ID) {
    const dueDate = (card.fields.properties[DUE_DATE_ID] ?? null) as number | null;
    propertyValueElement = (
      <RewardsDueDatePicker
        value={dueDate}
        disabled={readOnly || !isAdmin}
        onChange={(_value) => {
          if (reward) {
            updateReward({
              rewardId: reward.id,
              updateContent: {
                dueDate: _value?.toJSDate() || undefined
              }
            });
          }
        }}
      />
    );
  } else if (propertyTemplate.type === 'proposalReviewer') {
    const reviewerOptions: SelectOption[] = (propertyValue as unknown as ProposalReviewerProperty)?.map((reviewer) => ({
      group: reviewer.roleId ? 'role' : reviewer.userId ? 'user' : 'system_role',
      id: (reviewer.roleId ?? reviewer.userId ?? reviewer.systemRole) as string
    }));
    propertyValueElement = (
      <UserAndRoleSelect
        readOnly={
          !proposal ||
          readOnly ||
          (displayType !== 'details' && displayType !== 'table') ||
          proposal.currentStep?.step === 'draft' ||
          !!proposal.sourceTemplateId
        }
        required
        systemRoles={[allMembersSystemRole, authorSystemRole]}
        onChange={async (reviewers) => {
          const evaluationId = proposal?.currentEvaluationId;
          if (evaluationId) {
            try {
              await trigger({
                reviewers: reviewers.map((reviewer) => ({
                  roleId: reviewer.group === 'role' ? reviewer.id : null,
                  systemRole: reviewer.group === 'system_role' ? (reviewer.id as ProposalSystemRole) : null,
                  userId: reviewer.group === 'user' ? reviewer.id : null
                })),
                evaluationId
              });
              await mutate(`/api/spaces/${card.spaceId}/proposals`);
            } catch (err) {
              showError(err, 'Failed to update proposal reviewers');
            }
          }
        }}
        value={reviewerOptions}
        showEmptyPlaceholder={showEmptyPlaceholder}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
        displayType={displayType}
      />
    );
  }
  // TODO: use same component as proposalReviewer type?
  else if (propertyTemplate.id === REWARD_REVIEWERS_BLOCK_ID) {
    const reviewers: SelectOption[] = (propertyValue as unknown as RewardReviewer[]).map((reviewer) => ({
      group: reviewer.roleId ? 'role' : reviewer.userId ? 'user' : 'system_role',
      id: (reviewer.roleId ?? reviewer.userId) as string
    }));
    propertyValueElement = (
      <UserAndRoleSelect
        displayType={displayType}
        readOnly={readOnly || !isAdmin}
        onChange={(options) => {
          if (!reward) {
            return;
          }
          const reviewerOptions = options.filter((option) => option.group === 'role' || option.group === 'user');
          updateReward({
            rewardId: reward.id,
            updateContent: {
              reviewers: reviewerOptions.map((reviewer) => ({
                roleId: reviewer.group === 'role' ? reviewer.id : null,
                userId: reviewer.group === 'user' ? reviewer.id : null
              }))
            }
          });
        }}
        value={reviewers}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
      />
    );
  } else if (propertyTemplate.id === REWARD_STATUS_BLOCK_ID || propertyTemplate.id === APPLICANT_STATUS_BLOCK_ID) {
    if (propertyTemplate.id === REWARD_STATUS_BLOCK_ID && !reward) {
      return <EmptyPlaceholder>--</EmptyPlaceholder>;
    }

    if (REWARD_APPLICATION_STATUS_LABELS[propertyValue as ApplicationStatus]) {
      propertyValueElement = <RewardApplicationStatusChip status={propertyValue as ApplicationStatus} />;
    } else {
      propertyValueElement = <RewardStatusChip status={propertyValue as RewardStatus} showIcon={false} />;
    }
  } else if (propertyTemplate.id === REWARD_PROPOSAL_LINK) {
    if (!Array.isArray(propertyValue) || !propertyValue.length || !propertyValue[0]) {
      return null;
    }
    propertyValueElement = <URLProperty {...commonProps} value={propertyValue} validator={() => true} readOnly />;
  } else if (propertyTemplate.type === 'proposalReviewerNotes') {
    propertyValueElement = <ProposalNotesLink pageId={props.card.id} />;
  } else if (propertyTemplate.type === 'tokenAmount' || propertyTemplate.type === 'tokenChain') {
    const symbolOrAddress = card.fields.properties[REWARD_TOKEN] as string;
    const chainId = card.fields.properties[REWARD_CHAIN] as string;
    const rewardAmount = card.fields.properties[REWARD_AMOUNT] as number;
    const _rewardOnly =
      readOnly ||
      !isAdmin ||
      !reward ||
      getRewardType({
        chainId: Number(chainId),
        rewardAmount,
        rewardToken: symbolOrAddress
      }) !== 'token';

    propertyValueElement = (
      <RewardTokenDialog
        readOnly={_rewardOnly}
        readOnlyToken={_rewardOnly}
        requireTokenAmount
        currentReward={{
          chainId: Number(chainId),
          rewardAmount,
          rewardToken: symbolOrAddress
        }}
        onChange={(rewardToken) => {
          if (rewardToken && reward) {
            updateReward({
              rewardId: reward.id,
              updateContent: {
                chainId: rewardToken.chainId,
                rewardToken: rewardToken.rewardToken,
                rewardAmount: Number(rewardToken.rewardAmount),
                customReward: null
              }
            });
          }
        }}
      >
        {propertyTemplate.type === 'tokenAmount' ? (
          <TokenAmount amount={rewardAmount} chainId={chainId} symbolOrAddress={symbolOrAddress} />
        ) : (
          <TokenChain chainId={chainId} symbolOrAddress={symbolOrAddress} />
        )}
      </RewardTokenDialog>
    );
  } else if (propertyTemplate.id === REWARD_APPLICANTS_COUNT) {
    const totalApplicants = card.fields.properties[REWARD_APPLICANTS_COUNT];
    if (totalApplicants) {
      propertyValueElement = (
        <Stack flexDirection='row' gap={1} className='octo-propertyvalue readonly'>
          <Box width={20} display='flex' alignItems='center'>
            <PersonIcon fontSize='small' />
          </Box>
          {totalApplicants}
        </Stack>
      );
    }
  } else if (propertyTemplate.id === REWARD_CUSTOM_VALUE) {
    const symbolOrAddress = card.fields.properties[REWARD_TOKEN] as string;
    const chainId = card.fields.properties[REWARD_CHAIN] as string;
    const rewardAmount = card.fields.properties[REWARD_AMOUNT] as number;

    return (
      <TextInput
        placeholderText={emptyDisplayValue}
        value={value.toString()}
        onChange={setValue}
        multiline={displayType === 'details' ? true : (props.wrapColumn ?? false)}
        onSave={() => {
          if (reward) {
            try {
              updateReward({
                rewardId: reward.id,
                updateContent: {
                  customReward: value as string
                }
              });
            } catch (error) {
              showError(error);
            }
          }
        }}
        onCancel={() => setValue(propertyValue || '')}
        wrapColumn={props.wrapColumn ?? false}
        columnRef={props.columnRef}
        readOnly={
          readOnly ||
          !isAdmin ||
          !reward ||
          getRewardType({
            chainId: Number(chainId),
            rewardAmount,
            customReward: value as string,
            rewardToken: symbolOrAddress
          }) !== 'custom'
        }
        displayType={displayType}
      />
    );
  }

  // Proposals as datasource use proposalStatus column, whereas the actual proposals table uses STATUS_BLOCK_ID
  // We should migrate over the proposals as datasource blocks to the same format as proposals table
  else if (propertyTemplate.type === 'proposalStatus' || propertyTemplate.id === PROPOSAL_STATUS_BLOCK_ID) {
    // View inside proposals table
    if (proposal) {
      return <ProposalStatusSelect proposal={proposal} readOnly={!isAdmin} displayType={displayType} />;
    }

    // View inside database with proposals as source
    const evaluationTypeProperty = board.fields.cardProperties.find(
      (_cardProperty) => _cardProperty.type === 'proposalEvaluationType'
    );
    const evaluationType = card.fields.properties[evaluationTypeProperty?.id ?? ''] as ProposalEvaluationStep;
    const proposalEvaluationStatus = getProposalEvaluationStatus({
      result: propertyValue as ProposalEvaluationResultExtended,
      step: evaluationType
    });

    const statusLabel = EVALUATION_STATUS_LABELS[proposalEvaluationStatus];

    const optionValue = statusLabel;

    return (
      <TagSelect
        wrapColumn
        readOnly
        options={[
          {
            color: proposalStatusColors[proposalEvaluationStatus],
            id: proposalEvaluationStatus,
            value: optionValue
          }
        ]}
        propertyValue={proposalEvaluationStatus}
        onChange={() => {}}
        displayType={displayType}
      />
    );
  } else if (propertyTemplate.type === 'proposalStep' || propertyTemplate.id === PROPOSAL_STEP_BLOCK_ID) {
    if (!proposal) {
      return (
        <TagSelect
          wrapColumn
          includeSelectedOptions
          readOnly
          options={propertyTemplate.options}
          propertyValue={(propertyValue as string) ?? ''}
          onChange={() => {}}
          displayType={displayType}
        />
      );
    }
    return <ProposalStepSelect readOnly={!isAdmin} proposal={proposal} displayType={displayType} />;
  } else if (propertyTemplate.type === 'proposalEvaluationType') {
    return (
      <TagSelect
        wrapColumn
        includeSelectedOptions
        readOnly
        options={[
          {
            color: 'gray',
            id: propertyValue as string,
            value: PROPOSAL_STEP_LABELS[propertyValue as ProposalEvaluationStep]
          }
        ]}
        propertyValue={propertyValue as string}
        onChange={() => {}}
        displayType={displayType}
      />
    );
  } else if (propertyTemplate.type === 'relation') {
    return (
      <RelationPropertyPagesAutocomplete
        propertyTemplate={propertyTemplate}
        value={propertyValue as string | string[]}
        showCard={props.showCard}
        displayType={displayType}
        emptyPlaceholderContent={emptyDisplayValue}
        showEmptyPlaceholder={showEmptyPlaceholder}
        onChange={(pageListItemIds) => {
          syncRelationPropertyValue({
            templateId: propertyTemplate.id,
            pageIds: pageListItemIds,
            boardId: board.id,
            cardId: card.id
          }).catch((error) => {
            showError(error);
          });
        }}
        readOnly={readOnly}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
      />
    );
  } else if (propertyTemplate.type === 'select' || propertyTemplate.type === 'multiSelect') {
    propertyValueElement = (
      <TagSelect
        data-test='closed-select-input'
        data-test-active='active-select-autocomplete'
        canEditOptions={!readOnly && !disableEditPropertyOption}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
        multiselect={propertyTemplate.type === 'multiSelect'}
        displayValueAsOptions={propertyTemplate.dynamicOptions}
        readOnly={readOnly}
        propertyValue={propertyValue as string | string[]}
        options={propertyTemplate.options}
        onChange={async (newValue) => {
          try {
            await mutator.changePropertyValue(card, propertyTemplate.id, newValue);
          } catch (error) {
            showError(error);
          }
        }}
        onUpdateOption={async (option) => {
          try {
            await mutator.changePropertyOption(board, propertyTemplate, option);
          } catch (error) {
            showError(error);
          }
        }}
        onDeleteOption={async (option) => {
          try {
            await mutator.deletePropertyOption(board, propertyTemplate, option);
          } catch (error) {
            showError(error);
          }
        }}
        onCreateOption={async (newValue) => {
          try {
            await mutator.insertPropertyOption(board, propertyTemplate, newValue, 'add property option');
          } catch (error) {
            showError(error);
          }
        }}
        displayType={displayType}
      />
    );
    // Do not show  applicants in regular reward
  } else if (
    propertyTemplate.id === REWARDS_APPLICANTS_BLOCK_ID &&
    Array.isArray(propertyValue) &&
    !card.fields.isAssigned
  ) {
    propertyValueElement = null;
  } else if (propertyTemplate.type === 'person' || propertyTemplate.type === 'proposalEvaluatedBy') {
    propertyValueElement = (
      <UserSelect
        displayType={displayType}
        memberIds={typeof propertyValue === 'string' ? [propertyValue] : ((propertyValue as string[]) ?? [])}
        readOnly={readOnly || (displayType !== 'details' && displayType !== 'table')}
        onChange={async (newValue) => {
          try {
            await mutator.changePropertyValue(card, propertyTemplate.id, newValue);
            const previousValue = propertyValue
              ? typeof propertyValue === 'string'
                ? [propertyValue]
                : (propertyValue as string[])
              : [];
            const newUserIds = newValue.filter((id) => !previousValue.includes(id));
            Promise.all(
              newUserIds.map((userId) =>
                charmClient.createEvents({
                  spaceId: board.spaceId,
                  payload: [
                    {
                      cardId: card.id,
                      cardProperty: {
                        id: propertyTemplate.id,
                        name: propertyTemplate.name,
                        value: userId
                      },
                      scope: WebhookEventNames.CardPersonPropertyAssigned
                    }
                  ]
                })
              )
            );
          } catch (error) {
            showError(error);
          }
        }}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
        showEmptyPlaceholder={showEmptyPlaceholder}
      />
    );
  } else if (propertyTemplate.type === 'proposalAuthor') {
    propertyValueElement = (
      <UserSelect
        displayType={displayType}
        memberIds={typeof propertyValue === 'string' ? [propertyValue] : ((propertyValue as string[]) ?? [])}
        readOnly={readOnly || (displayType !== 'details' && displayType !== 'table')}
        onChange={async (newValue) => {
          if (proposal) {
            try {
              await charmClient.proposals.updateProposal({
                proposalId: proposal.id,
                authors: newValue
              });
              await mutate(`/api/spaces/${board.spaceId}/proposals`);
            } catch (error) {
              showError(error);
            }
          }
        }}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
        showEmptyPlaceholder={showEmptyPlaceholder}
      />
    );
  } else if (propertyTemplate.type === 'date') {
    if (readOnly) {
      propertyValueElement = (
        <Box
          className='octo-propertyvalue readonly'
          display='flex'
          alignItems={displayType !== 'table' ? 'center' : 'flex-start'}
          sx={{ whiteSpace: displayType !== 'table' || props.wrapColumn ? 'break-spaces' : 'nowrap' }}
        >
          {displayValue || (showEmptyPlaceholder && <EmptyPlaceholder>{emptyDisplayValue}</EmptyPlaceholder>)}
        </Box>
      );
    } else {
      propertyValueElement = (
        <DateRange
          centerContent={displayType !== 'table'}
          wrapColumn={props.wrapColumn}
          className='octo-propertyvalue'
          value={value.toString()}
          key={value.toString()}
          showEmptyPlaceholder={showEmptyPlaceholder}
          onChange={async (newValue) => {
            try {
              await mutator.changePropertyValue(card, propertyTemplate.id, newValue);
            } catch (error) {
              showError(error);
            }
          }}
        />
      );
    }
  } else if (propertyTemplate.type === 'checkbox') {
    propertyValueElement = (
      <Checkbox
        displayType={displayType}
        label={propertyTemplate.name}
        isOn={propertyValue === 'true'}
        onChanged={async (newBool) => {
          const newValue = newBool ? 'true' : '';
          try {
            await mutator.changePropertyValue(card, propertyTemplate.id, newValue);
          } catch (error) {
            showError(error);
          }
        }}
        readOnly={readOnly}
      />
    );
  } else if (propertyTemplate.type === 'createdBy') {
    propertyValueElement = <CreatedBy userId={card.createdBy} />;
  } else if (propertyTemplate.type === 'updatedBy') {
    propertyValueElement = <LastModifiedBy updatedBy={latestUpdated === 'card' ? card.updatedBy : updatedBy} />;
  } else if (propertyTemplate.type === 'createdTime') {
    propertyValueElement = (
      <CreatedAt
        createdAt={card.createdAt}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
        centerContent={displayType !== 'table'}
      />
    );
  } else if (propertyTemplate.type === 'proposalPublishedAt' || propertyTemplate.type === 'proposalEvaluationDueDate') {
    propertyValueElement = propertyValue ? (
      <CreatedAt
        createdAt={new Date(propertyValue as string).getTime()}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
        centerContent={displayType !== 'table'}
      />
    ) : (
      ''
    );
  } else if (propertyTemplate.type === 'updatedTime') {
    propertyValueElement = (
      <LastModifiedAt
        updatedAt={new Date(latestUpdated === 'card' ? card.updatedAt : updatedAt).toString()}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
        centerContent={displayType !== 'table'}
      />
    );
  } else if ((propertyTemplate as any).type === 'optimism_project_profile' && typeof value === 'object') {
    propertyValueElement = <OptimismProjectLink value={value as unknown as OpProjectFieldValue} />;
  }

  if (editableFields.includes(propertyTemplate.type)) {
    if (propertyTemplate.type === 'url') {
      propertyValueElement = <URLProperty {...commonProps} />;
    } else if (propertyTemplate.id !== REWARD_CUSTOM_VALUE) {
      propertyValueElement = (
        <TextInput
          {...commonProps}
          readOnly={
            readOnly ||
            propertyTemplate.id === REWARDS_AVAILABLE_BLOCK_ID ||
            propertyTemplate.id === REWARDS_APPLICANTS_BLOCK_ID ||
            propertyTemplate.id === REWARD_APPLICANTS_COUNT ||
            propertyTemplate.id === REWARD_PROPOSAL_LINK ||
            propertyTemplate.id === REWARD_CUSTOM_VALUE
          }
          displayType={propertyTemplate.id === REWARDS_AVAILABLE_BLOCK_ID ? 'details' : commonProps.displayType}
        />
      );
    }
  } else if (propertyTemplate.type === 'proposalUrl' && typeof displayValue === 'string' && !propertyValueElement) {
    const proposalUrl = getAbsolutePath(`/${propertyValue as string}`, domain);
    propertyValueElement = (
      <div data-test='property-proposal-url'>
        <URLProperty {...commonProps} value={proposalUrl} validator={() => true} />
      </div>
    );
  } else if (propertyValueElement === null) {
    const displayValueStr =
      typeof displayValue === 'string' || typeof displayValue === 'number' ? displayValue.toString() : '';
    if (
      typeof displayValue !== 'string' &&
      typeof displayValue !== 'number' &&
      typeof displayValue !== 'undefined' &&
      !Array.isArray(displayValue)
    ) {
      log.error('displayValue for card property is not a string', {
        displayValue,
        displayValueStr,
        propertyTemplate: props.propertyTemplate
      });
    }

    propertyValueElement = (
      <div className={clsx('octo-propertyvalue', { readonly: readOnly })}>
        {displayValueStr || (showEmptyPlaceholder && <EmptyPlaceholder>{emptyDisplayValue}</EmptyPlaceholder>)}
      </div>
    );
  }

  const hasCardValue = ['createdBy', 'updatedBy', 'createdTime', 'updatedTime'].includes(propertyTemplate.type);
  const hasArrayValue = Array.isArray(value) && value.length > 0;
  const hasStringValue = !Array.isArray(value) && !!value;
  const hasValue = hasCardValue || hasArrayValue || hasStringValue;

  if (!hasValue && props.readOnly && displayType !== 'details') {
    return typeof subRowsEmptyValueContent === 'string' ? (
      <span>{subRowsEmptyValueContent}</span>
    ) : (
      (subRowsEmptyValueContent ?? null)
    );
  }

  if (props.showTooltip) {
    return (
      <Tooltip
        title={
          props.propertyTemplate.tooltip ? (
            <div>
              {props.propertyTemplate.name}
              <br />
              {props.propertyTemplate.tooltip}
            </div>
          ) : (
            props.propertyTemplate.name
          )
        }
      >
        <div style={{ width: '100%' }}>{propertyValueElement}</div>
      </Tooltip>
    );
  }

  return propertyValueElement;
}

export default memo(PropertyValueElement);
