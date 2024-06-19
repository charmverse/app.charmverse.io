import { PathBasedRouter } from 'connect-api/lib/pathBasedRouter';

const router = new PathBasedRouter();

router.get('', (ctx) => {
  ctx.body = {
    message: 'Hello, World!'
  };
});

export default router;
