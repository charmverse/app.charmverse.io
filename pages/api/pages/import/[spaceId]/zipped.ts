import fs from 'node:fs/promises';
import path from 'node:path';

import type { Page } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const outputFolderName = path.join(__dirname, 'uploads');

export const config = {
  api: {
    bodyParser: false // Disallow body parsing, consume as stream
  }
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

// upload.single('file')
handler.post(importZippedController);
async function importZippedController(req: NextApiRequest, res: NextApiResponse<Page[]>) {
  try {
    await fs.readdir(outputFolderName);
  } catch (err) {
    await fs.mkdir(outputFolderName);
  }

  req.on('data', (chunk) => {
    fs.writeFile(path.join(outputFolderName, `test-${Date.now()}.zip`), chunk);
    res.status(200).send([]);
  });
}
// export const config = {
//   api: {
//     bodyParser: false // Disallow body parsing, consume as stream
//   }
// };
export default withSessionRoute(handler);
