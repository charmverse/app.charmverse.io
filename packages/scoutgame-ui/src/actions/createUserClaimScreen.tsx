import { S3Client, type PutObjectCommandInput } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getS3ClientConfig } from '@packages/aws/getS3ClientConfig';
import { getClaimablePointsWithSources } from '@packages/scoutgame/points/getClaimablePointsWithSources';
import { baseUrl } from '@packages/utils/constants';
import puppeteer from 'puppeteer';
import React from 'react';

import { PointsClaimBuilderScreen } from '../components/claim/components/PointsClaimScreen/PointsClaimModal/PointsClaimBuilderScreen';
import { PointsClaimScoutScreen } from '../components/claim/components/PointsClaimScreen/PointsClaimModal/PointsClaimScoutScreen';

const client = new S3Client(getS3ClientConfig());

export async function createUserClaimScreen({ userId, week }: { userId: string; week: string }) {
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
    const bucket = process.env.S3_UPLOAD_BUCKET;

    const params: PutObjectCommandInput = {
      Bucket: bucket,
      Key: `points-claim/${userId}/${week}.png`,
      Body: screenshot,
      ContentType: 'image/png'
    };

    const s3Upload = new Upload({
      client,
      params
    });

    await s3Upload.done();
    log.info('generated claim creen', { claimedPoints, bucket, week, userId });
  } catch (e) {
    log.error('error generating claim screen', { userId, week, claimedPoints, error: e });
  } finally {
    await browser.close();
  }
  return { week };
}
