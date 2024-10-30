/**
 * OpenSea Metadata Specification Type
 * Represents the metadata schema used for OpenSea items.
 *
 * @docs https://docs.opensea.io/docs/metadata-standards
 */
import type { PutObjectCommandInput, S3ClientConfig } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import { getNftFilePath, imageDomain } from './utils';

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

function getS3ClientConfig() {
  const config: Pick<S3ClientConfig, 'region' | 'credentials'> = {
    region: process.env.S3_UPLOAD_REGION
  };

  if (process.env.S3_UPLOAD_KEY && process.env.S3_UPLOAD_SECRET) {
    config.credentials = {
      accessKeyId: process.env.S3_UPLOAD_KEY as string,
      secretAccessKey: process.env.S3_UPLOAD_SECRET as string
    };
  }
  return config;
}

const client = new S3Client(getS3ClientConfig());

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
  attributes
}: {
  path: string;
  season: string;
  tokenId: bigint | number;
  attributes?: { trait_type: string; value: string | number }[];
}): Promise<string> {
  // Define the S3 path for metadata
  const metadataPath = getNftFilePath({ season, tokenId: Number(tokenId), type: 'metadata.json' });

  // Generate the metadata object
  const metadata: OpenSeaMetadata = {
    name: `ScoutGame Builders NFT #${tokenId}`,
    description: '',
    external_url: `${process.env.DOMAIN}/u/${path}`,
    image: `${imageDomain}/${getNftFilePath({ season, tokenId: Number(tokenId), type: 'artwork.png' })}`,
    attributes: attributes || []
  };

  // Convert metadata to JSON buffer
  const metadataBuffer = Buffer.from(JSON.stringify(metadata));

  // Set up the S3 upload parameters
  const params: PutObjectCommandInput = {
    ACL: 'public-read',
    Bucket: process.env.SCOUTGAME_S3_BUCKET,
    Key: `nft/${metadataPath}`,
    Body: metadataBuffer,
    ContentType: 'application/json'
  };

  const s3Upload = new Upload({
    client,
    params
  });

  await s3Upload.done();

  return `${imageDomain}/${metadataPath}`;
}
