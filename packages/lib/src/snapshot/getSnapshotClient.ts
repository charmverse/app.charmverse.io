export async function getSnapshotClient() {
  const snapshot = (await import('@snapshot-labs/snapshot.js')).default;

  const hub = 'https://hub.snapshot.org'; // or https://testnet.snapshot.org for testnet
  return new snapshot.Client712(hub);
}
