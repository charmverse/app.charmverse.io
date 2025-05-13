import { updateMixpanelProfilesTask } from 'apps/cron/src/tasks/updateMixpanelProfilesTask';

export async function updateMixpanelBlockCounts() {
  await updateMixpanelProfilesTask();
}

updateMixpanelBlockCounts().then(() => {
  console.log('Done.');
});
