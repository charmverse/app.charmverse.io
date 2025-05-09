import type { RewardType } from './interfaces';
import type { UpdateableRewardFields } from './updateRewardSettings';

export type RewardApplicationType = 'application_required' | 'direct_submission' | 'assigned';

export function getApplicationType(
  values: Pick<UpdateableRewardFields, 'approveSubmitters' | 'assignedSubmitters'>,
  forcedApplicationType?: RewardApplicationType
) {
  if (forcedApplicationType) {
    return forcedApplicationType;
  }

  let applicationType: RewardApplicationType = values?.approveSubmitters ? 'application_required' : 'direct_submission';

  if (values?.assignedSubmitters?.length) {
    applicationType = 'assigned';
  }

  return applicationType;
}
