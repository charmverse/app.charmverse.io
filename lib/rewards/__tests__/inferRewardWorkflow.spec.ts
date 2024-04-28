import type { RewardWorkflow } from '../getRewardWorkflows';
import { inferRewardWorkflow } from '../inferRewardWorkflow';

describe('inferRewardWorkflow', () => {
  it(`Should return application required workflow if reward is not assigned and approveSubmitters is true`, () => {
    const workflows = [
      { id: 'application_required' },
      { id: 'direct_submission' },
      { id: 'assigned' }
    ] as any as RewardWorkflow[];

    const reward = {
      approveSubmitters: true,
      assignedSubmitters: []
    };

    const result = inferRewardWorkflow(workflows, reward);

    expect(result).toEqual(workflows[0]);
  });

  it(`Should return direct submission workflow if reward is not assigned and approveSubmitters is false`, () => {
    const workflows = [
      { id: 'application_required' },
      { id: 'direct_submission' },
      { id: 'assigned' }
    ] as any as RewardWorkflow[];

    const reward = {
      approveSubmitters: false,
      assignedSubmitters: []
    };

    const result = inferRewardWorkflow(workflows, reward);

    expect(result).toEqual(workflows[1]);
  });

  it(`Should return assigned workflow if reward is assigned`, () => {
    const workflows = [
      { id: 'application_required' },
      { id: 'direct_submission' },
      { id: 'assigned' }
    ] as any as RewardWorkflow[];

    const reward = {
      approveSubmitters: false,
      assignedSubmitters: ['user1']
    };

    const result = inferRewardWorkflow(workflows, reward);

    expect(result).toEqual(workflows[2]);
  });
});
