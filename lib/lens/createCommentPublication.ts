import type { ProfileFragment, PublicationMetadataV2Input } from '@lens-protocol/client';
import { PublicationMainFocus, PublicationMetadataDisplayTypes } from '@lens-protocol/client';
import { v4 as uuid } from 'uuid';

import { getUserLocale } from 'lib/utilities/browser';

import { lensClient } from './lensClient';
import { uploadToArweave } from './uploadToArweave';

export async function createCommentPublication({
  lensProfile,
  contentText,
  postId,
  commentLink
}: {
  postId: string;
  contentText: string;
  commentLink: string;
  lensProfile: ProfileFragment;
}) {
  const canUseRelay = lensProfile?.dispatcher?.canUseRelay;

  const metadata: PublicationMetadataV2Input = {
    version: '2.0.0',
    metadata_id: uuid(),
    content: `${contentText}\n\nView on CharmVerse ${commentLink}`,
    external_url: `https://lenster.xyz/u/${lensProfile.handle}`,
    image: null,
    imageMimeType: null,
    name: `Comment by @${lensProfile.handle}`,
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
    from: lensProfile.id,
    contentURI: `ar://${arweaveId}`,
    commentOn: postId
  };

  if (canUseRelay) {
    const dataAvailabilityPostViaDispatcher = await lensClient.publication.createDataAvailabilityCommentViaDispatcher(
      dataAvailabilityRequest
    );
    return {
      dispatcherUsed: true,
      data: dataAvailabilityPostViaDispatcher
    };
  }

  const postTypedData = await lensClient.publication.createDataAvailabilityCommentTypedData(dataAvailabilityRequest);

  return {
    dispatcherUsed: false,
    data: postTypedData
  };
}
