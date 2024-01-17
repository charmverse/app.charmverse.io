// This is an auto-generated file, do not edit manually
export const definition = {
  models: {
    SignedCredentialThree: {
      interface: false,
      implements: [],
      id: 'kjzl6hvfrbw6c5bl01xoclr86o2gb92wmjh04z4zecooyss4cfx7i87cy9sl68e',
      accountRelation: { type: 'list' }
    }
  },
  objects: {
    SignedCredentialThree: {
      sig: { type: 'string', required: true },
      type: { type: 'reference', refType: 'enum', refName: 'AttestationType', required: false, indexed: true },
      issuer: { type: 'string', required: true, indexed: true },
      chainId: { type: 'integer', required: true },
      content: { type: 'string', required: true },
      schemaId: { type: 'string', required: true, indexed: true },
      recipient: { type: 'string', required: true, indexed: true },
      timestamp: { type: 'datetime', required: true, indexed: true },
      verificationUrl: { type: 'string', required: true },
      author: { type: 'view', viewType: 'documentAccount' }
    }
  },
  enums: { AttestationType: ['proposal'] },
  accountData: { signedCredentialThreeList: { type: 'connection', name: 'SignedCredentialThree' } }
};
