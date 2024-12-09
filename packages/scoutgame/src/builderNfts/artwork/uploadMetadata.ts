import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';

import { getBuilderStarterPackContractAddress } from '../constants';

import { builderNftArtworkContractName } from './constants';
import { getNftTokenUrlPath, imageDomain } from './utils';

/**
 * OpenSea Metadata Specification Type
 * Represents the metadata schema used for OpenSea items.
 *
 * @docs https://docs.opensea.io/docs/metadata-standards
 */
type OpenSeaMetadata = {
  /**
   * URL to the image of the item.
   * Can be any type of image (including SVGs, which are cached into PNGs by OpenSea),
   * IPFS or Arweave URLs or paths. Recommended minimum size is 3000 x 3000 pixels.
   * Optional.
   */
  image?: string;

  /**
   * Raw SVG image data, if you want to generate images on the fly (not recommended).
   * Only use this if the `image` parameter is not included.
   * Optional.
   */
  image_data?: string;

  /**
   * URL that appears below the asset's image on OpenSea and allows users to leave OpenSea
   * and view the item on your site.
   * Optional.
   */
  external_url?: string;

  /**
   * Human-readable description of the item. Markdown is supported.
   * Optional.
   */
  description?: string;

  /**
   * Name of the item.
   * Required.
   */
  name: string;

  /**
   * Attributes for the item, which will show up on the OpenSea page for the item.
   * Example: [{ "trait_type": "Speed", "value": 10 }]
   * Optional.
   */
  attributes?: {
    trait_type: string;
    value: string | number;
  }[];

  /**
   * Background color of the item on OpenSea. Must be a six-character hexadecimal string
   * without a pre-pended '#'.
   * Optional.
   */
  background_color?: string;

  /**
   * URL to a multi-media attachment for the item. Supported file extensions: GLTF, GLB, WEBM,
   * MP4, M4V, OGV, OGG. Supported audio-only extensions: MP3, WAV, OGA.
   *
   * `animation_url` also supports HTML pages, enabling you to build rich experiences and
   * interactive NFTs using JavaScript canvas, WebGL, and more. Scripts and relative paths
   * within the HTML page are supported. However, access to browser extensions is not supported.
   * Optional.
   */
  animation_url?: string;

  /**
   * URL to a YouTube video. This is only used if `animation_url` is not provided.
   * Optional.
   */
  youtube_url?: string;
};

/**
 * Uploads OpenSea metadata to S3.
 *
 * @param {Object} params - Parameters for creating the OpenSea metadata.
 * @param {string} params.path - The path of the NFT owner.
 * @param {string} params.season - The season of the NFT.
 * @param {string | null} params.avatar - The avatar image URL for the NFT.
 * @param {bigint | number} params.tokenId - The unique token ID of the NFT.
 * @param {string} params.description - A human-readable description of the item.
 * @param {string} params.externalUrl - The external URL to link the NFT.
 * @param {string} params.name - The name of the NFT.
 * @param {Array<Object>} [params.attributes] - Optional attributes for the NFT.
 * @returns {Promise<string>} - The URL of the uploaded metadata JSON.
 */
export async function uploadMetadata({
  path,
  season,
  tokenId,
  attributes,
  starterPack
}: {
  path: string;
  season: string;
  tokenId: bigint | number;
  attributes?: { trait_type: string; value: string | number }[];
  starterPack?: boolean;
}): Promise<string> {
  // Define the S3 path for metadata
  const metadataPath = getNftTokenUrlPath({
    season,
    tokenId: Number(tokenId),
    filename: starterPack ? 'starter-pack-metadata.json' : 'metadata.json',
    contractName: starterPack ? getBuilderStarterPackContractAddress() : builderNftArtworkContractName
  });

  // Generate the metadata object
  const metadata: OpenSeaMetadata = {
    name: `ScoutGame Builders NFT #${tokenId}`,
    description: '',
    external_url: `${process.env.DOMAIN}/u/${path}`,
    image: `${imageDomain}/${getNftTokenUrlPath({
      season,
      tokenId: Number(tokenId),
      filename: starterPack ? 'starter-pack-artwork.png' : 'artwork.png',
      contractName: starterPack ? getBuilderStarterPackContractAddress() : builderNftArtworkContractName
    })}`,
    attributes: attributes || []
  };

  // Convert metadata to JSON buffer
  const metadataBuffer = Buffer.from(JSON.stringify(metadata));

  await uploadFileToS3({
    pathInS3: `nft/${metadataPath}`,
    bucket: process.env.SCOUTGAME_S3_BUCKET,
    content: metadataBuffer,
    contentType: 'application/json'
  });

  return `${imageDomain}/${metadataPath}`;
}
