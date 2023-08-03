import { Writable } from 'stream';

import formidable from 'formidable';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import sharp from 'sharp';

import { getUserS3FilePath, uploadFileToS3 } from 'lib/aws/uploadToS3Server';
import { DEFAULT_IMAGE_SIZE, DEFAULT_MAX_FILE_SIZE_MB, FORM_DATA_FILE_PART_NAME } from 'lib/file/constants';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(resizeImage);

async function resizeImage(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id;
  const chunks: Buffer[] = [];

  const writable = new Writable({
    write: (chunk, _enc, next) => {
      chunks.push(chunk);
      next();
    }
  });

  const form = formidable({
    fileWriteStreamHandler: () => writable,
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
    const optimizedBuffer = await sharp(Buffer.concat(chunks))
      .resize({
        withoutEnlargement: true,
        width: DEFAULT_IMAGE_SIZE
      })
      .webp({ quality: 80 })
      .toBuffer();

    const { fileUrl: url } = await uploadFileToS3({
      pathInS3: getUserS3FilePath({ userId, url: image.originalFilename ?? image.newFilename }),
      content: optimizedBuffer,
      contentType: 'image/webp'
    });

    res.status(200).send({ url });
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
