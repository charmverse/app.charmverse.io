import type { BountyStatus, Prisma } from '@charmverse/core/prisma-client';
import { Box, Collapse, Divider, Stack } from '@mui/material';
import { useState } from 'react';

import { PropertyLabel } from 'components/common/DatabaseEditor/components/properties/PropertyLabel';
import { TemplateSelect } from 'components/common/WorkflowSidebar/components/TemplateSelect';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import type { RewardPropertiesField } from 'lib/rewards/blocks/interfaces';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplate';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { RewardType } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import { isTruthy } from 'lib/utils/types';

import type { UpdateableRewardFieldsWithType } from '../../hooks/useNewReward';
import type { BoardReward } from '../../hooks/useRewardsBoardAdapter';

import { RewardPropertiesHeader } from './components/RewardPropertiesHeader';
import { CustomPropertiesAdapter } from './CustomPropertiesAdapter';

type Props = {
  onChange: (values: Partial<UpdateableRewardFieldsWithType>) => void;
  values: UpdateableRewardFieldsWithType;
  readOnly?: boolean;
  pageId?: string;
  isNewReward?: boolean;
  isTemplate?: boolean;
  expandedByDefault?: boolean;
  selectTemplate: (template: RewardTemplate | null) => void;
  templateId?: string;
  readOnlyTemplate?: boolean;
  rewardStatus?: BountyStatus | null;
};
export function RewardPropertiesForm({
  onChange,
  values,
  readOnly,
  isNewReward = false,
  isTemplate,
  pageId,
  expandedByDefault,
  selectTemplate,
  templateId,
  readOnlyTemplate,
  rewardStatus
}: Props) {
  const [isExpanded, setIsExpanded] = useState(!!expandedByDefault);
  const { templates: rewardTemplates = [] } = useRewardTemplates();

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

  function setRewardType(rewardType: RewardType) {
    if (rewardType === 'none' && rewardStatus !== 'paid') {
      applyUpdates({
        rewardAmount: null,
        chainId: null,
        rewardToken: null,
        customReward: null
      });
    }

    onChange({
      rewardType,
      customReward: rewardType === 'custom' ? values.customReward : null,
      rewardAmount: rewardType === 'token' ? values.rewardAmount : null,
      rewardToken: rewardType === 'token' ? values.rewardToken : null,
      chainId: rewardType === 'token' ? values.chainId : null
    });
  }

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
          reward={values}
          pageId={pageId || ''}
          isExpanded={isExpanded}
          toggleExpanded={() => setIsExpanded((v) => !v)}
          readOnly={readOnly || !pageId}
        />

        <Collapse in={isExpanded} timeout='auto' unmountOnExit>
          <>
            {/* {!isTemplate && isNewReward && (
              <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
                <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                  <PropertyLabel readOnly highlighted>
                    Template
                  </PropertyLabel>
                  <Box display='flex' flex={1}>
                    <TemplateSelect
                      options={rewardTemplates.map((rewardTemplate) => rewardTemplate.page)}
                      disabled={readOnlyTemplate || readOnly}
                      value={templateId}
                      onChange={(templatePage) => {
                        if (!templatePage) {
                          selectTemplate(null);
                        }
                        const selected = rewardTemplates.find((_template) => _template.page.id === templatePage?.id);
                        if (selected && selectTemplate) {
                          selectTemplate(selected);
                        }
                        setRewardType(getRewardType(selected || values, isNewReward, !!templatePage));
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            )} */}

            <CustomPropertiesAdapter
              readOnly={readOnly}
              reward={values as unknown as BoardReward}
              onChange={(properties: RewardPropertiesField) => {
                applyUpdates({
                  fields: { properties: properties ? { ...properties } : {} } as Prisma.JsonValue
                });
              }}
            />
          </>
        </Collapse>
      </Stack>
    </Box>
  );
}
