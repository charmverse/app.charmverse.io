import { updateSpacesMixpanelProfilesTask } from "background/tasks/updateSpacesMixpanelProfilesTask";

export async function updateMixpanelBlockCounts() {
  await updateSpacesMixpanelProfilesTask();
}

updateMixpanelBlockCounts().then(() => {
  console.log('Done.')
})