import { PathBasedRouter } from '@connect-api/lib/pathBasedRouter';
import { randomIntFromInterval } from 'lib/utils/random';

const router = new PathBasedRouter();

router.GET((ctx) => {
  ctx.body = {
    number: randomIntFromInterval(1, 100)
  };
});

export default router;
