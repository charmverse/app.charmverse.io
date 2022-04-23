import { uploadToS3 } from '../lib/aws/uploadToS3Server';

console.log(uploadToS3);

(async () => {
  const file = await uploadToS3({
    fileName: 'test.png',
    url: 'https://www.notion.vip/wp-content/uploads/notion_api.jpg'
  });
  console.log(file);
})();

export {};
