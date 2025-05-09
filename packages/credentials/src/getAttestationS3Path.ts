export function getAttestationS3Path({
  charmverseId,
  schemaId,
  charmverseIdType
}: {
  schemaId: string;
  charmverseId: string;
  charmverseIdType: 'project' | 'profile';
}) {
  return `attestations/${schemaId}/${charmverseIdType}-${charmverseId}/metadata.json`;
}
