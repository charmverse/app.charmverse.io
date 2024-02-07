import { updateSpacesMixpanelProfilesTask } from 'background/tasks/updateMixpanelProfilesTask';

export async function updateMixpanelBlockCounts() {
  await updateSpacesMixpanelProfilesTask();
}

updateMixpanelBlockCounts().then(() => {
  console.log('Done.');
});
