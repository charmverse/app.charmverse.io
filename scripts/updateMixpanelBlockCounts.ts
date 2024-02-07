import { updateMixpanelProfilesTask } from 'background/tasks/updateMixpanelProfilesTask';

export async function updateMixpanelBlockCounts() {
  await updateMixpanelProfilesTask();
}

updateMixpanelBlockCounts().then(() => {
  console.log('Done.');
});
