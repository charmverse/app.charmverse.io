import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';
import { getLastWeek } from '@packages/scoutgame/dates';
import { getClaimablePointsWithSources } from '@packages/scoutgame/points/getClaimablePointsWithSources';
import { baseUrl } from '@packages/utils/constants';
import puppeteer from 'puppeteer';

import { PointsClaimBuilderScreen } from '../components/claim/components/PointsClaimScreen/PointsClaimModal/PointsClaimBuilderScreen';
import { PointsClaimScoutScreen } from '../components/claim/components/PointsClaimScreen/PointsClaimModal/PointsClaimScoutScreen';

export async function createUserClaimScreen(userId: string) {
  const { renderToString } = await import('react-dom/server');

  const user = await prisma.scout.findUniqueOrThrow({
    where: { id: userId },
    select: {
      displayName: true
    }
  });
  const { builders, points: claimedPoints, repos } = await getClaimablePointsWithSources(userId);
  const browser = await puppeteer.launch({
    // These flags are required to load the fonts and run the browser inside docker container
    args: ['--disable-web-security', '--disable-setuid-sandbox', '--no-sandbox']
  });
  const isBuilder = repos.length > 0;
  const displayName = user.displayName;

  try {
    const component = isBuilder ? (
      <PointsClaimBuilderScreen
        displayName={displayName}
        claimedPoints={claimedPoints}
        repos={repos}
        // Need to pass baseUrl to the component to load the fonts and images
        baseUrl={baseUrl}
      />
    ) : (
      <PointsClaimScoutScreen
        displayName={displayName}
        claimedPoints={claimedPoints}
        builders={builders}
        baseUrl={baseUrl}
      />
    );

    const renderedHtml = renderToString(component);

    const html = `
    <html>
      <head>
        <style>
          @font-face {
            font-family: 'Posterama';
            src: url('${baseUrl}/fonts/Posterama-Bold.ttf') format('truetype');
            font-weight: bold;
            font-style: normal;
            font-display: swap;
          }

          @font-face {
            font-family: 'K2D';
            src: url('${baseUrl}/fonts/K2D-Medium.ttf') format('truetype');
            font-weight: 500;
            font-style: normal;
            font-display: swap;
          }

          body {
            font-family: 'Inter', sans-serif;
          }
        </style>
      </head>
      <body>
        <div id="root">
          <img src="${baseUrl}/images/claim-share-background.png" alt="Claim share background" width="600" height="600" style="position: absolute; top: 0; left: 0;" />
          ${renderedHtml}
        </div>
      </body>
    </html>
  `;

    const page = await browser.newPage();

    await page.setViewport({ width: 600, height: 600 });
    await page.setContent(html);
    await page.evaluateHandle('document.fonts.ready');
    await page.waitForSelector('.scoutgame-claim-screen', { visible: true });
    await page.waitForNetworkIdle();

    const screenshot = await page.screenshot();

    await uploadFileToS3({
      pathInS3: `points-claim/${userId}/${getLastWeek()}.png`,
      bucket: process.env.S3_UPLOAD_BUCKET,
      content: screenshot as Buffer,
      contentType: 'image/png'
    });

    log.info('generated claim screen', { userId });
  } catch (e) {
    log.error('error generating claim screen', { userId, error: e });
  } finally {
    await browser.close();
  }
}
