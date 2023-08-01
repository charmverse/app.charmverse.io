import fs from 'fs/promises';
import { join } from 'path';

import formidable from 'formidable';
import { DateTime } from 'luxon';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import sharp from 'sharp';

import { DEFAULT_IMAGE_SIZE, DEFAULT_MAX_FILE_SIZE_MB, FORM_DATA_FILE_PART_NAME } from 'lib/file/constants';
import { makeDirectory } from 'lib/file/makeDirectory';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(resizeImage);

async function resizeImage(req: NextApiRequest, res: NextApiResponse) {
  const uploadDir = join(process.env.ROOT_DIR || process.cwd(), `/uploads/${DateTime.now().toFormat('dd-MM-yyyy')}`);

  await makeDirectory(uploadDir);

  const form = formidable({
    uploadDir,
    maxFileSize: DEFAULT_MAX_FILE_SIZE_MB * 1024 * 1024,
    filter: (part) => {
      return part.name === FORM_DATA_FILE_PART_NAME && (part.mimetype?.includes('image') || false);
    }
  });
  const [, files] = await form.parse(req);
  if (files && files[FORM_DATA_FILE_PART_NAME]) {
    const image = Array.isArray(files[FORM_DATA_FILE_PART_NAME])
      ? files[FORM_DATA_FILE_PART_NAME][0]
      : files.uploadedFile;
    const optimizedBuffer = await sharp(image.filepath)
      .resize({
        withoutEnlargement: true,
        width: DEFAULT_IMAGE_SIZE
      })
      .webp({ quality: 80 })
      .toBuffer();

    // Delete the temporary file
    await fs.unlink(image.filepath);

    res.status(200);
    res.setHeader('Content-Type', 'image/webp');
    res.send(optimizedBuffer);
  } else {
    res.status(400).end();
  }
}

// Disable body parser so we can use formidable
export const config = {
  api: {
    bodyParser: false
  }
};

export default withSessionRoute(handler);
