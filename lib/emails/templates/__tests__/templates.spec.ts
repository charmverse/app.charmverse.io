
import { tasksRequiresYourAttention } from '../PendingTasks';

describe('Email template unit tests', () => {

  it('Subject line should be formatted properly for one task', async () => {
    const subject = tasksRequiresYourAttention({ count: 1 });
    expect(subject).toEqual('1 task needs your attention');
  });

  it('Subject line should include CharmVerse name', async () => {
    const subject = tasksRequiresYourAttention({ count: 1, includeName: true });
    expect(subject).toEqual('1 CharmVerse task needs your attention');
  });

  it('Subject line should be formatted properly for >1 task', async () => {
    const subject = tasksRequiresYourAttention({ count: 3 });
    expect(subject).toEqual('3 tasks need your attention');
  });
});
