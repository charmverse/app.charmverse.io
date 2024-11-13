import { S3Client, type PutObjectCommandInput } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { prisma } from '@charmverse/core/prisma-client';
import { getS3ClientConfig } from '@packages/aws/getS3ClientConfig';
import { getLastWeek } from '@packages/scoutgame/dates';
import { baseUrl } from '@root/config/constants';
import puppeteer from 'puppeteer';
import React from 'react';

import { PointsClaimBuilderScreen } from '../../components/claim/components/PointsClaimScreen/PointsClaimModal/PointsClaimBuilderScreen';
import { PointsClaimScoutScreen } from '../../components/claim/components/PointsClaimScreen/PointsClaimModal/PointsClaimScoutScreen';
import { getUnclaimedPointsSource } from '../../lib/points/getUnclaimedPointsSource';

const client = new S3Client(getS3ClientConfig());

export async function createUserClaimScreen(userId: string) {
  const { renderToString } = await import('react-dom/server');

  const user = await prisma.scout.findUniqueOrThrow({
    where: { id: userId },
    select: {
      displayName: true
    }
  });
  const { builders, builderPoints, scoutPoints, repos } = await getUnclaimedPointsSource(userId);
  const browser = await puppeteer.launch({
    // This is required to load the fonts
    args: ['--disable-web-security']
  });
  const isBuilder = builderPoints > 0;
  const claimedPoints = builderPoints + scoutPoints;
  const displayName = user.displayName;

  try {
    const component = isBuilder ? (
      <PointsClaimBuilderScreen
        displayName={displayName}
        claimedPoints={claimedPoints}
        repos={repos}
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

    const params: PutObjectCommandInput = {
      Bucket: process.env.S3_UPLOAD_BUCKET,
      Key: `points-claim/${userId}/${getLastWeek()}.png`,
      Body: screenshot,
      ContentType: 'image/png'
    };

    const s3Upload = new Upload({
      client,
      params
    });

    await s3Upload.done();
  } finally {
    await browser.close();
  }
}
