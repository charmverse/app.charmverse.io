import { prisma } from '@charmverse/core/prisma-client';

async function convertCharmEditorApplicationInput() {
  const applications = await prisma.application.findMany({
    where: {
      message: {
        not: null
      }
    },
    select: {
      id: true,
      message: true
    }
  });

  const total = applications.length;
  let current = 0;

  for (const application of applications) {
    current++;
    try {
      if (application.message) {
        await prisma.application.update({
          where: {
            id: application.id
          },
          data: {
            messageNodes: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: application.message
                    }
                  ]
                }
              ]
            }
          }
        });
      }
    } catch (err) {
      console.error(`Failed to convert message for application ${application.id}`, err);
    } finally {
      console.log(`Processed ${current} of ${total} applications`);
    }
  }
}

convertCharmEditorApplicationInput().then(() => null);
