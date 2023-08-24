import type { CreatePublicPostRequest, ProfileFragment, PublicationMetadataV2Input } from '@lens-protocol/client';
import { CollectModules, PublicationMainFocus, PublicationMetadataDisplayTypes } from '@lens-protocol/client';
import { v4 as uuid } from 'uuid';

import { POST } from 'adapters/http';
import { getUserLocale } from 'lib/utilities/browser';

import type { CollectModuleType } from './interfaces';
import { lensClient } from './lensClient';

const INITIAL_COLLECT_MODULE: CollectModuleType = {
  type: CollectModules.RevertCollectModule,
  amount: null,
  referralFee: 0,
  collectLimit: null,
  timeLimit: false,
  recipients: [],
  followerOnlyCollect: false
};

const uploadToArweave = async (data: any): Promise<string> => {
  const response = await POST<string>('https://metadata.lenster.xyz', data, {
    headers: { 'Content-Type': 'application/json' },
    // remove credentials to bypass CORS error
    credentials: 'omit'
  });
  // Lenster response header content type is text/plain;charset=UTF-8, so we need to json parse it manually
  const { id } = JSON.parse(response);
  return id;
};

const collectModuleParams = (collectModule: CollectModuleType): { revertCollectModule: true } => {
  switch (collectModule.type) {
    default:
      return { revertCollectModule: true };
  }
};

export async function createPostPublication({
  lensProfile,
  contentText,
  proposalLink
}: {
  contentText: string;
  proposalLink: string;
  lensProfile: ProfileFragment;
}) {
  const restricted = false;

  // Dispatcher
  const canUseRelay = lensProfile?.dispatcher?.canUseRelay;
  const isSponsored = (lensProfile?.dispatcher as ProfileFragment['dispatcher'] & { sponsor: null | boolean })?.sponsor;

  const isRevertCollectModule = INITIAL_COLLECT_MODULE.type === CollectModules.RevertCollectModule;
  const useDataAvailability = !restricted && isRevertCollectModule;

  const metadata: PublicationMetadataV2Input = {
    version: '2.0.0',
    metadata_id: uuid(),
    content: `${contentText} \n\n View on CharmVerse: ${proposalLink}`,
    external_url: `https://lenster.xyz/u/${lensProfile.handle}`,
    image: null,
    imageMimeType: null,
    name: `Post by @${lensProfile.handle}`,
    animation_url: null,
    mainContentFocus: PublicationMainFocus.TextOnly,
    attributes: [{ traitType: 'type', displayType: PublicationMetadataDisplayTypes.String, value: 'text_only' }],
    media: [],
    tags: [],
    locale: getUserLocale(),
    // lenster uses Lenster
    appId: 'CharmVerse'
  };

  const arweaveId = await uploadToArweave(metadata);

  const dataAvailabilityRequest = {
    from: lensProfile?.id,
    contentURI: `ar://${arweaveId}`
  };

  const request: CreatePublicPostRequest = {
    profileId: lensProfile.id,
    contentURI: `ar://${arweaveId}`,
    collectModule: collectModuleParams(INITIAL_COLLECT_MODULE)
  };

  if (canUseRelay) {
    if (useDataAvailability && isSponsored) {
      const dataAvailabilityPostViaDispatcher = await lensClient.publication.createDataAvailabilityPostViaDispatcher(
        dataAvailabilityRequest
      );
      return {
        method: 'dataAvailabilityPostViaDispatcher',
        data: dataAvailabilityPostViaDispatcher
      };
    }

    const postViaDispatcher = await lensClient.publication.createPostViaDispatcher(request);
    return {
      method: 'postViaDispatcher',
      data: postViaDispatcher
    };
  }

  // No dispatcher was found so we need to manually sign the post publication transaction
  const postTypedData = await lensClient.publication.createPostTypedData(request);

  return {
    method: 'postTypedData',
    data: postTypedData
  };
}
