import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { SchemaRegistry, getSchemaUID } from '@ethereum-attestation-service/eas-sdk';
import { optimismSepolia } from 'viem/chains';
import { easSchemaChains, easConnectors, getEasInstance } from 'lib/credentials/connectors';
import { NULL_ADDRESS } from 'lib/credentials/constants';
import { http } from 'viem';
import { publicClientToProvider, walletClientToSigner } from 'lib/utils/ethers';
import { createWalletClient, createPublicClient, PublicClient } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

type PrivateKeyString = `0x${string}`;
const privateKey = process.env.PRIVATE_KEY as PrivateKeyString;

const schema = 'uint256 eventId, uint8 tokenWeight';

async function deploy() {
  // get registry contract
  const schemaRegistry = new SchemaRegistry(easConnectors[optimismSepolia.id].schemaRegistryContract);
  // connect wallet
  schemaRegistry.connect(_getSigner(privateKey));

  const transaction = await schemaRegistry.register({
    schema,
    resolverAddress: NULL_ADDRESS,
    revocable: true
  });
  console.log('transaction:', transaction);
  // SchemaUID is deterministic
  const schemaUid = getSchemaUID(schema, NULL_ADDRESS, true);
  console.log('Schema UID:', schemaUid);
}

async function attest() {
  // get attestation contract
  const eas = getEasInstance(optimismSepolia.id);
  // connect wallet
  eas.connect(_getSigner(privateKey));

  // Initialize SchemaEncoder with the schema string
  const schemaEncoder = new SchemaEncoder(schema);
  const encodedData = schemaEncoder.encodeData([
    { name: 'eventId', value: 123, type: 'uint256' },
    { name: 'tokenWeight', value: 3, type: 'uint8' }
  ]);

  // SchemaUID is deterministic
  const schemaUid = getSchemaUID(schema, NULL_ADDRESS, true);

  const tx = await eas.attest({
    schema: schemaUid,
    data: {
      recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
      expirationTime: 0,
      revocable: true, // Be aware that if your schema is not revocable, this MUST be false
      data: encodedData
    }
  });

  const newAttestationUID = await tx.wait();

  console.log('New attestation UID:', newAttestationUID);
}

async function getAttest() {
  // https://optimism-sepolia.easscan.org/schema/view/0x4e8e23323b64a44397094df3378380d06a5276cc7f48c6e581e513522a7ae64e
  const uid = '0xf99e959ae394ff73f9223945e6444f9b1055abd5ee484570d67eb47ade949715';
  const schema = 'string appName,uint8 score,string appReview';

  // get attestation contract
  const eas = getEasInstance(optimismSepolia.id);
  // connect wallet
  // eas.connect(_getSigner(privateKey));
  const client = createPublicClient({
    chain: optimismSepolia,
    transport: http()
  }) as PublicClient;
  eas.connect(publicClientToProvider(client));

  const attestation = await eas.getAttestation(uid);

  const decoder = new SchemaEncoder(schema);
  const parsed = decoder.decodeData(attestation.data);
  const values = parsed.reduce((acc, item) => {
    acc[item.name] = item.value.value as string;
    return acc;
  }, {} as Record<string, string | number>);

  console.log(attestation);
  console.log('data', values);
}

function _getSigner(_privateKey: PrivateKeyString) {
  const account = privateKeyToAccount(_privateKey as `0x${string}`);
  const client = createWalletClient({
    account,
    chain: optimismSepolia,
    transport: http()
  });
  return walletClientToSigner(client);
}

deploy().then().catch(console.error);
