import { processGemsPayout } from '../tasks/processGemsPayout';

export async function query() {
  await processGemsPayout();
}
query();
