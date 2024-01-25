import type { BountyStatus } from '@charmverse/core/prisma-client';
import { Box, Collapse, Divider, Stack, Tooltip } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import clsx from 'clsx';
import debounce from 'lodash/debounce';
import { DateTime } from 'luxon';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { StyledFocalboardTextInput } from 'components/common/BoardEditor/components/properties/TextInput';
import type { RoleOption } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserSelect } from 'components/common/BoardEditor/components/properties/UserSelect';
import Checkbox from 'components/common/BoardEditor/focalboard/src/widgets/checkbox';
import { TemplateSelect } from 'components/proposals/ProposalPage/components/TemplateSelect';
import { RewardApplicationType } from 'components/rewards/components/RewardProperties/components/RewardApplicationType';
import { RewardPropertiesHeader } from 'components/rewards/components/RewardProperties/components/RewardPropertiesHeader';
import type { RewardTokenDetails } from 'components/rewards/components/RewardProperties/components/RewardTokenProperty';
import { RewardTokenProperty } from 'components/rewards/components/RewardProperties/components/RewardTokenProperty';
import type { RewardType } from 'components/rewards/components/RewardProperties/components/RewardTypeSelect';
import { RewardTypeSelect } from 'components/rewards/components/RewardProperties/components/RewardTypeSelect';
import { CustomPropertiesAdapter } from 'components/rewards/components/RewardProperties/CustomPropertiesAdapter';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { RewardFieldsProp, RewardPropertiesField } from 'lib/rewards/blocks/interfaces';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplates';
import type { Reward, RewardWithUsers, RewardReviewer } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import { isTruthy } from 'lib/utilities/types';

type Props = {
  onChange: (values: Partial<UpdateableRewardFields>) => void;
  values: UpdateableRewardFields;
  readOnly?: boolean;
  // only needed for saving existing reward
  useDebouncedInputs?: boolean;
  pageId?: string;
  refreshPermissions?: VoidFunction;
  isNewReward?: boolean;
  isTemplate?: boolean;
  expandedByDefault?: boolean;
  selectTemplate: (template: RewardTemplate) => void;
  templateId?: string;
  readOnlyTemplate?: boolean;
  resetTemplate?: VoidFunction;
  forcedApplicationType?: RewardApplicationType;
  rewardStatus?: BountyStatus | null;
};

const getApplicationType = (values: UpdateableRewardFields, forcedApplicationType?: RewardApplicationType) => {
  if (forcedApplicationType) {
    return forcedApplicationType;
  }

  let applicationType: RewardApplicationType = values?.approveSubmitters ? 'application_required' : 'direct_submission';

  if (values?.assignedSubmitters?.length) {
    applicationType = 'assigned';
  }

  return applicationType;
};

export function RewardPropertiesForm({
  onChange,
  values,
  readOnly,
  useDebouncedInputs,
  isNewReward,
  isTemplate,
  pageId,
  expandedByDefault,
  selectTemplate,
  templateId,
  readOnlyTemplate,
  resetTemplate,
  forcedApplicationType,
  rewardStatus
}: Props) {
  const [rewardApplicationType, setRewardApplicationTypeRaw] = useState<RewardApplicationType>(() =>
    getApplicationType(values, forcedApplicationType)
  );
  const { getFeatureTitle } = useSpaceFeatures();
  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!!expandedByDefault);
  const [rewardType, setRewardType] = useState(values?.customReward ? 'Custom' : ('Token' as RewardType));
  const allowedSubmittersValue: RoleOption[] = (values?.allowedSubmitterRoles ?? []).map((id) => ({
    id,
    group: 'role'
  }));

  const isAssignedReward = rewardApplicationType === 'assigned';
  const { templates: rewardTemplates = [] } = useRewardTemplates();

  const setRewardApplicationType = useCallback((updatedType: RewardApplicationType) => {
    if (updatedType === 'direct_submission') {
      applyUpdates({
        approveSubmitters: false,
        assignedSubmitters: null
      });
    }

    if (updatedType === 'application_required') {
      applyUpdates({
        approveSubmitters: true,
        assignedSubmitters: null
      });
    }

    setRewardApplicationTypeRaw(updatedType);
  }, []);

  useEffect(() => {
    if (isTruthy(values?.customReward)) {
      setRewardType('Custom');
    } else if (!values?.rewardToken || !values?.rewardAmount || !values?.chainId) {
      setRewardType('None');
    }
  }, [values?.customReward, values?.rewardAmount, values?.rewardToken, values?.chainId]);

  async function applyUpdates(updates: Partial<UpdateableRewardFields>) {
    if ('customReward' in updates) {
      const customReward = updates.customReward;
      if (isTruthy(customReward)) {
        updates.rewardAmount = null;
        updates.chainId = null;
        updates.rewardToken = null;
      }
    }

    onChange(updates);
  }

  useEffect(() => {
    if (rewardType === 'None' && rewardStatus !== 'paid') {
      applyUpdates({
        rewardAmount: null,
        chainId: null,
        rewardToken: null,
        customReward: null
      });
    }
  }, [rewardType, rewardStatus]);

  const applyUpdatesDebounced = useMemo(() => {
    if (useDebouncedInputs) {
      return debounce((updates: Partial<UpdateableRewardFields>) => {
        applyUpdates(updates);
      }, 1000);
    }

    return applyUpdates;
  }, [useDebouncedInputs]);

  async function onRewardTokenUpdate(rewardToken: RewardTokenDetails | null) {
    if (rewardToken) {
      await applyUpdates({
        chainId: rewardToken.chainId,
        rewardToken: rewardToken.rewardToken,
        rewardAmount: Number(rewardToken.rewardAmount),
        customReward: null
      });
    }
  }

  const updateRewardCustomReward = useCallback((e: any) => {
    applyUpdatesDebounced({
      customReward: e.target.value
    });
  }, []);

  const updateAssignedSubmitters = useCallback((submitters: string[]) => {
    applyUpdates({
      assignedSubmitters: submitters,
      approveSubmitters: false,
      allowMultipleApplications: false
    });
  }, []);

  const updateRewardMaxSubmissions = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const updatedValue = Number(e.target.value);

    applyUpdatesDebounced({
      maxSubmissions: updatedValue <= 0 ? null : updatedValue
    });
  }, []);

  const updateRewardDueDate = useCallback((date: DateTime | null) => {
    applyUpdatesDebounced({
      dueDate: date?.toJSDate() || undefined
    });
  }, []);

  if (!values) {
    return null;
  }

  return (
    <Box
      className='CardDetail content'
      sx={{
        '.octo-propertyname .Button': {
          paddingLeft: '0 !important'
        },
        display: 'flex',
        flex: 1,
        mt: 0
      }}
      mt={2}
    >
      <Stack className='octo-propertylist' mt={2} flex={1}>
        <Divider />

        <RewardPropertiesHeader
          reward={values as RewardWithUsers}
          pageId={pageId || ''}
          isExpanded={isExpanded}
          toggleExpanded={() => setIsExpanded((v) => !v)}
          readOnly={readOnly || !pageId}
        />

        <Collapse in={isExpanded} timeout='auto' unmountOnExit>
          <>
            {!isTemplate && isNewReward && (
              <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
                <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                  <PropertyLabel readOnly highlighted>
                    Template
                  </PropertyLabel>
                  <Box display='flex' flex={1}>
                    <TemplateSelect
                      options={rewardTemplates.map((rewardTemplate) => rewardTemplate.page)}
                      disabled={readOnlyTemplate}
                      value={templateId ? { id: templateId } : null}
                      onChange={(templatePage) => {
                        if (!templatePage) {
                          resetTemplate?.();
                        }
                        const template = rewardTemplates.find((_template) => _template.page.id === templatePage?.id);
                        if (template && selectTemplate) {
                          selectTemplate(template);
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            )}

            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted required={isNewReward && !isTemplate}>
                Reviewers
              </PropertyLabel>
              <UserAndRoleSelect
                readOnly={readOnly}
                value={values.reviewers ?? []}
                onChange={async (options) => {
                  const reviewerOptions = options.filter(
                    (option) => option.group === 'role' || option.group === 'user'
                  ) as RewardReviewer[];
                  await applyUpdates({
                    reviewers: reviewerOptions.map((option) => ({ group: option.group, id: option.id }))
                  });
                }}
              />
            </Box>

            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                Due date
              </PropertyLabel>

              <DateTimePicker
                minDate={DateTime.fromMillis(Date.now())}
                value={values?.dueDate || null}
                disableMaskedInput
                disabled={readOnly}
                onAccept={async (value) => {
                  updateRewardDueDate(value);
                }}
                onChange={(value) => {
                  updateRewardDueDate(value);
                }}
                renderInput={(_props) => (
                  <StyledFocalboardTextInput
                    {..._props}
                    inputProps={{
                      ..._props.inputProps,
                      readOnly: true,
                      className: clsx('Editable octo-propertyvalue', { readonly: readOnly }),
                      placeholder: 'Empty'
                    }}
                    fullWidth
                    onClick={() => {
                      setIsDateTimePickerOpen((v) => !v);
                    }}
                    placeholder='Empty'
                  />
                )}
                onClose={() => setIsDateTimePickerOpen(false)}
                open={isDateTimePickerOpen}
              />
            </Box>

            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                Application Type
              </PropertyLabel>
              <RewardApplicationType
                readOnly={readOnly || !!forcedApplicationType}
                value={rewardApplicationType}
                onChange={setRewardApplicationType}
              />
            </Box>

            {/* <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                Application required
              </PropertyLabel>

              <Checkbox
                isOn={Boolean(values?.approveSubmitters)}
                onChanged={(isOn) => {
                  applyUpdates({
                    approveSubmitters: !!isOn
                  });
                }}
                disabled={readOnly}
                readOnly={readOnly}
              />
            </Box> */}

            {!isAssignedReward && (
              <>
                <Tooltip placement='left' title='Allow the same user to participate in this reward more than once'>
                  <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                    <PropertyLabel readOnly highlighted>
                      Allow multiple entries
                    </PropertyLabel>

                    <Checkbox
                      isOn={Boolean(values?.allowMultipleApplications)}
                      onChanged={(isOn) => {
                        applyUpdates({
                          allowMultipleApplications: !!isOn
                        });
                      }}
                      disabled={readOnly}
                      readOnly={readOnly}
                    />
                  </Box>
                </Tooltip>

                <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                  <PropertyLabel readOnly highlighted>
                    Applicant Roles
                  </PropertyLabel>
                  <UserAndRoleSelect
                    type='role'
                    readOnly={readOnly}
                    value={allowedSubmittersValue}
                    onChange={async (options) => {
                      const roleIds = options.filter((option) => option.group === 'role').map((option) => option.id);

                      await applyUpdates({
                        allowedSubmitterRoles: roleIds
                      });
                    }}
                  />
                </Box>

                <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                  <PropertyLabel readOnly highlighted>
                    # Available
                  </PropertyLabel>
                  <StyledFocalboardTextInput
                    onChange={updateRewardMaxSubmissions}
                    required
                    defaultValue={values?.maxSubmissions}
                    type='number'
                    size='small'
                    inputProps={{
                      step: 1,
                      min: 1,
                      style: { height: 'auto' },
                      className: clsx('Editable octo-propertyvalue', { readonly: readOnly })
                    }}
                    sx={{
                      width: '100%'
                    }}
                    disabled={readOnly}
                    placeholder='Unlimited'
                  />
                </Box>
              </>
            )}

            {/* Select authors */}
            {isAssignedReward && (
              <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                <PropertyLabel readOnly required={!isTemplate && !readOnly} highlighted>
                  Assigned applicants
                </PropertyLabel>
                <Box display='flex' flex={1}>
                  <UserSelect
                    memberIds={values?.assignedSubmitters ?? []}
                    readOnly={readOnly}
                    onChange={updateAssignedSubmitters}
                    wrapColumn
                    showEmptyPlaceholder
                    error={
                      !isNewReward && !values?.assignedSubmitters?.length && !readOnly
                        ? 'Requires at least one assignee'
                        : undefined
                    }
                  />
                </Box>
              </Box>
            )}

            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                Type
              </PropertyLabel>
              <RewardTypeSelect readOnly={readOnly} value={rewardType} onChange={setRewardType} />
            </Box>

            {rewardType === 'Token' && (
              <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                <PropertyLabel readOnly highlighted required={isNewReward && !isTemplate}>
                  Token
                </PropertyLabel>
                <RewardTokenProperty
                  onChange={onRewardTokenUpdate}
                  currentReward={values as (RewardCreationData & RewardWithUsers) | null}
                  readOnly={readOnly}
                />
              </Box>
            )}

            {rewardType === 'Custom' && (
              <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                <PropertyLabel readOnly highlighted required={isNewReward && !isTemplate}>
                  Custom {getFeatureTitle('Reward')}
                </PropertyLabel>

                <StyledFocalboardTextInput
                  onChange={updateRewardCustomReward}
                  value={values?.customReward ?? ''}
                  required
                  size='small'
                  inputProps={{
                    style: { height: 'auto' },
                    className: clsx('Editable octo-propertyvalue', { readonly: readOnly })
                  }}
                  sx={{
                    width: '100%'
                  }}
                  disabled={readOnly}
                  placeholder='T-shirt'
                  autoFocus
                  rows={1}
                  type='text'
                />
              </Box>
            )}

            <CustomPropertiesAdapter
              readOnly={readOnly}
              reward={values as RewardWithUsers & RewardFieldsProp}
              onChange={(properties: RewardPropertiesField) => {
                applyUpdates({
                  fields: { properties: properties ? { ...properties } : {} } as Reward['fields']
                });
              }}
            />
          </>
        </Collapse>
      </Stack>
    </Box>
  );
}
