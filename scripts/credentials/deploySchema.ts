import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { SchemaRegistry, getSchemaUID } from '@ethereum-attestation-service/eas-sdk';
import { optimismSepolia, sepolia } from 'viem/chains';
import { EasSchemaChain, easConnectors, getEasInstance } from 'lib/credentials/connectors';
import { NULL_ADDRESS } from 'lib/credentials/constants';

import { getOnChainSchemaUrl, getOnChainAttestationUrl } from 'lib/credentials/connectors';
import { Wallet, providers } from 'ethers';
import { http } from 'viem';
import { publicClientToProvider } from 'lib/utils/ethers';
import type { Chain } from 'viem/chains';
import { createPublicClient, PublicClient } from 'viem';

type PrivateKeyString = `0x${string}`;
const privateKey = process.env.PRIVATE_KEY as PrivateKeyString;

if (!privateKey) {
  throw new Error('PRIVATE_KEY env variable is required');
}

// const schema = 'uint256 eventId, uint8 tokenWeight';

async function deploy(chain: Chain, _schema: string) {
  // get registry contract
  const schemaRegistry = new SchemaRegistry(easConnectors[chain.id as EasSchemaChain].schemaRegistryContract);
  // connect wallet
  schemaRegistry.connect(_getSigner(privateKey, chain));

  // SchemaUID is deterministic
  const schemaUid = getSchemaUID(_schema, NULL_ADDRESS, true);
  console.log('Schema UID:', schemaUid);

  const deployedSchema = await schemaRegistry.getSchema({ uid: schemaUid }).catch((err) => null);
  if (deployedSchema) {
    console.log('Schema already deployed:');
    return deployedSchema;
  }
  const transaction = await schemaRegistry.register({
    schema: _schema,
    resolverAddress: NULL_ADDRESS,
    revocable: true
  });
  return transaction;
}

async function attest(
  chain: Chain,
  _schema: string,
  data: { name: string; value: number | string; type: string }[],
  refUID?: string
) {
  // get attestation contract
  const eas = getEasInstance(chain.id as EasSchemaChain);
  // connect wallet
  eas.connect(_getSigner(privateKey, chain));

  // Initialize SchemaEncoder with the schema string
  const schemaEncoder = new SchemaEncoder(_schema);
  const encodedData = schemaEncoder.encodeData(data);
  // [
  //   { name: 'eventId', value: 1, type: 'uint256' },
  //   { name: 'tokenWeight', value: 1, type: 'uint8' }
  // ]);

  // SchemaUID is deterministic
  const schemaUid = getSchemaUID(_schema, NULL_ADDRESS, true);

  const response = await eas.attest({
    schema: schemaUid,
    data: {
      recipient: NULL_ADDRESS,
      // recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
      expirationTime: 0,
      revocable: true, // Be aware that if your schema is not revocable, this MUST be false
      data: encodedData,
      refUID: refUID
    }
  });

  const newAttestationUID = await response.wait();

  // console.log('New attestation UID:', newAttestationUID);
  return { response, uid: newAttestationUID };
}

async function getAttest() {
  // https://optimism-sepolia.easscan.org/schema/view/0x4e8e23323b64a44397094df3378380d06a5276cc7f48c6e581e513522a7ae64e
  // const uid = '0xf99e959ae394ff73f9223945e6444f9b1055abd5ee484570d67eb47ade949715';
  // const schema = 'string appName,uint8 score,string appReview';
  // sepolia example
  const chain = sepolia;
  const uid = '0xc72cc61df805f7a1e2c0477702807f1a8cfbe195f1001022e5a5c5b2ded5f0f9';
  const schema = 'string post';

  // get attestation contract
  const eas = getEasInstance(chain.id);
  // connect wallet
  // eas.connect(_getSigner(privateKey));
  const client = createPublicClient({
    chain: chain,
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

function _getSigner(_privateKey: PrivateKeyString, chain: Chain) {
  const rpc = chain.rpcUrls.default.http[0];
  const provider = new providers.JsonRpcProvider(chain.rpcUrls.default.http[0], chain.id);
  return new Wallet(_privateKey, provider);
}

// getAttest().then().catch(console.error);

async function doStuff() {
  const chain = optimismSepolia;
  const uidSchema = 'string uid';
  const profileSchema = 'string name';
  const eventSchema = 'string event, uint8 type';
  // deploy
  console.log('Deploy uid schema', await deploy(chain, uidSchema));
  console.log('Deploy profile schema', await deploy(chain, profileSchema));
  console.log('Deploy event schema', await deploy(chain, eventSchema));

  const uidAttestation = await attest(chain, uidSchema, [{ name: 'uid', value: '0x123', type: 'string' }]);
  console.log('UID Attestation:', uidAttestation);
  console.log(
    'UID Attestation Link:',
    getOnChainAttestationUrl({ chainId: chain.id, attestationId: uidAttestation.uid })
  );
  const profileAttestation = await attest(
    chain,
    profileSchema,
    [{ name: 'name', value: 'Wild Thang', type: 'string' }],
    uidAttestation.uid
  );
  console.log('Profile Attestation:', profileAttestation);
  const eventAttestation = await attest(
    chain,
    eventSchema,
    [
      { name: 'event', value: 'ETH Denver sign-up', type: 'string' },
      { name: 'type', value: 1, type: 'uint8' }
    ],
    uidAttestation.uid
  );
  console.log('Event Attestation:', eventAttestation);
}

doStuff().then().catch(console.error);
