import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { SchemaRegistry, getSchemaUID } from '@ethereum-attestation-service/eas-sdk';
import { optimismSepolia } from 'viem/chains';
import { EasSchemaChain, easConnectors } from '@packages/credentials/connectors';
import { getEasInstance } from '@packages/credentials/getEasInstance';
import { zeroAddress } from 'viem';

import { Wallet, providers } from 'ethers';
import { http } from 'viem';
import { publicClientToProvider } from 'lib/utils/ethers';
import type { Chain } from 'viem/chains';
import { createPublicClient, PublicClient } from 'viem';

type PrivateKeyString = `0x${string}`;
const privateKey = `0x${process.env.CREDENTIAL_WALLET_KEY as string}` as PrivateKeyString;

if (!privateKey) {
  throw new Error('PRIVATE_KEY env variable is required');
}

// const schema = 'uint256 eventId, uint8 tokenWeight';

const RESOLVER_ADDRESS = '0x3354B452e319E03de8eC4047cB56209304DFA645';
const RECIPIENT_ADDRESS = '0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2';

async function deploy(chain: Chain, schema: string, resolverAddress: string = zeroAddress) {
  // get registry contract
  const schemaRegistry = new SchemaRegistry(easConnectors[chain.id as EasSchemaChain].schemaRegistryContract);
  // connect wallet
  schemaRegistry.connect(_getSigner(privateKey, chain));

  // SchemaUID is deterministic
  const schemaUid = getSchemaUID(schema, resolverAddress, true);
  console.log('Deploying Schema', schema, 'UID:', schemaUid);

  const deployedSchema = await schemaRegistry.getSchema({ uid: schemaUid }).catch((err) => {
    // console.error('error retrieving schema', err.message);
  });
  if (deployedSchema) {
    console.log('Schema already deployed!');
    return deployedSchema;
  }
  // register a new schema
  const transaction = await schemaRegistry.register({
    schema: schema,
    resolverAddress,
    revocable: true
  });
  return transaction;
}

deploy(
  optimismSepolia,
  'bytes32 projectRefUID,uint256 farcasterID,string name,string category,bytes32 parentProjectRefUID,uint8 metadataType,string metadataUrl'
)
  .then()
  .catch(console.error);

async function attest({
  chain,
  schema,
  data,
  refUID,
  resolverAddress = zeroAddress,
  recipient = RECIPIENT_ADDRESS
}: {
  chain: Chain;
  schema: string;
  data: { name: string; value: number | string; type: string }[];
  refUID?: string;
  resolverAddress?: string;
  recipient?: string;
}) {
  // get attestation contract
  const eas = getEasInstance(chain.id as EasSchemaChain);
  // connect wallet
  eas.connect(_getSigner(privateKey, chain));

  // Initialize SchemaEncoder with the schema string
  const schemaEncoder = new SchemaEncoder(schema);
  const encodedData = schemaEncoder.encodeData(data);
  // [
  //   { name: 'eventId', value: 1, type: 'uint256' },
  //   { name: 'tokenWeight', value: 1, type: 'uint8' }
  // ]);

  // SchemaUID is deterministic
  const schemaUid = getSchemaUID(schema, resolverAddress, true);

  const response = await eas.attest(
    {
      schema: schemaUid,
      data: {
        recipient,
        // recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
        expirationTime: 0,
        revocable: true, // Be aware that if your schema is not revocable, this MUST be false
        data: encodedData,
        refUID: refUID
      }
    },
    {
      gasLimit: 1000000
    }
  );

  const newAttestationUID = await response.wait();

  // console.log('New attestation UID:', newAttestationUID);
  return { response, uid: newAttestationUID };
}

async function getAttest() {
  // https://optimism-sepolia.easscan.org/schema/view/0x4e8e23323b64a44397094df3378380d06a5276cc7f48c6e581e513522a7ae64e
  // const uid = '0xf99e959ae394ff73f9223945e6444f9b1055abd5ee484570d67eb47ade949715';
  // const schema = 'string appName,uint8 score,string appReview';
  // sepolia example
  const chain = optimismSepolia;
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
  const values = parsed.reduce(
    (acc, item) => {
      acc[item.name] = item.value.value as string;
      return acc;
    },
    {} as Record<string, string | number>
  );

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
  const uniqueField = 'V123456'; // + Date.now();
  const eventSchema = 'uint256 Value,string Event,uint8 Category,string ' + uniqueField;
  // // deploy
  //console.log('Deploy uid schema', await deploy(chain, uidSchema));
  // console.log('Deploy profile schema', await deploy(chain, profileSchema));
  console.log('Deploy event schema', await deploy(chain, eventSchema, RESOLVER_ADDRESS));

  // const uidAttestation = await attest(chain, uidSchema, [{ name: 'uid', value: '0x123', type: 'string' }]);
  // console.log('UID Attestation:', uidAttestation);
  // console.log(
  //   'UID Attestation Link:',
  //   getOnChainAttestationUrl({ chainId: chain.id, attestationId: uidAttestation.uid })
  // );
  // const profileAttestation = await attest(
  //   chain,
  //   profileSchema,
  //   [{ name: 'name', value: 'Wild Thang', type: 'string' }],
  //   uidAttestation.uid
  // );
  // console.log('Profile Attestation:', profileAttestation);
  const eventAttestation = await attest({
    chain,
    schema: eventSchema,
    resolverAddress: RESOLVER_ADDRESS,
    data: [
      { name: 'Value', value: 12, type: 'uint256' },
      { name: 'Event', value: 'ETH Denver sign-up', type: 'string' },
      { name: 'Category', value: 1, type: 'uint8' },
      { name: uniqueField, value: '', type: 'string' }
    ]
    //uidAttestation.uid
    // '0x84027c80e2017d462c549f1a0b62505acdba029147dfd60fb501507635f858b4'
  });
  console.log('Event Attestation:', eventAttestation);
}

// doStuff().then().catch(console.error);
