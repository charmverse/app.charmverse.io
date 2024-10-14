import type { BuilderEvent, NFTPurchaseEvent, PointsReceipt } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client'; // Assuming prisma is directly imported from your Prisma client instance

import { mockBuilder, mockBuilderNft, mockNFTPurchaseEvent, mockScout } from '../database'; // Assuming mockBuilderNft is in a separate file

describe('mockNFTPurchaseEvent', () => {
  it('should create an NFT purchase event, passing through the parameters and creating the points receipts', async () => {
    // Assuming you have a function to create a mock builderNft
    const builder = await mockBuilder();
    const scout = await mockScout();
    const points = 10;
    const tokensPurchased = 100;

    const currentSeason = 'current-mock-season';

    await mockBuilderNft({
      builderId: builder.id
    });

    const result = await mockNFTPurchaseEvent({
      builderId: builder.id,
      scoutId: scout.id,
      points,
      season: currentSeason,
      tokensPurchased
    });

    // Verify builderEvent and nftPurchaseEvent creation
    const createdEvent = await prisma.builderEvent.findFirstOrThrow({
      where: {
        nftPurchaseEventId: result.nftPurchaseEventId
      },
      include: { nftPurchaseEvent: true }
    });

    expect(createdEvent).toMatchObject(
      expect.objectContaining<Partial<BuilderEvent & { nftPurchaseEvent: Partial<NFTPurchaseEvent> }>>({
        builderId: builder.id,
        type: 'nft_purchase',
        season: currentSeason,
        nftPurchaseEvent: expect.objectContaining({
          pointsValue: points,
          tokensPurchased,
          scoutId: scout.id
        })
      })
    );

    const pointsReceipts = await prisma.pointsReceipt.findMany({
      where: {
        event: {
          id: createdEvent.id
        }
      }
    });

    expect(pointsReceipts).toHaveLength(1);

    expect(pointsReceipts[0]).toMatchObject(
      expect.objectContaining<Partial<PointsReceipt>>({
        claimedAt: null,
        eventId: createdEvent.id,
        recipientId: builder.id,
        senderId: scout.id,
        value: points
      })
    );
  });
});
