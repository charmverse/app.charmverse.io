import { Task, TaskType } from 'models';

export const tasks: Task[] = [{
  id: '2a2b16ba-2a0e-458f-a6cd-24af8745dcf7',
  date: new Date(),
  description: 'Send 23.2 CHARM',
  links: [{
    id: 'd89de30b-0531-4321-a38c-73c9176d6bfa',
    name: 'Gnosis',
    url: 'https://gnosis-safe.io/app/'
  }, {
    id: '4ebbc49e-9703-4415-91f7-0e2022799c47',
    name: 'Bounty',
    url: 'https://app.charmverse.io/'
  }],
  type: TaskType.multisig,
  workspace: 'Bankless'
}, {
  id: '4d74b96c-3126-483f-8641-961dff09706e',
  date: new Date(),
  description: 'Send 0.5 ETH',
  links: [{
    id: '874e80f6-4c31-44a0-a0a6-ebb96bb93b9a',
    name: 'Gnosis',
    url: 'https://gnosis-safe.io/app/'
  }],
  type: TaskType.multisig,
  workspace: 'Bankless'
}];
