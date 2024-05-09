// General ERC ABI used for multiple cases
export const ercAbi = [
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'numSeconds', internalType: 'uint256', type: 'uint256' }]
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'uint8'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export const erc1155Abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export const molochDaoAbi = [
  {
    constant: true,
    inputs: [
      {
        name: '',
        type: 'address'
      }
    ],
    name: 'members',
    outputs: [
      {
        name: 'delegateKey',
        type: 'address'
      },
      {
        name: 'shares',
        type: 'uint256'
      },
      {
        name: 'loot',
        type: 'uint256'
      },
      {
        name: 'exists',
        type: 'bool'
      },
      {
        name: 'highestIndexYesVote',
        type: 'uint256'
      },
      {
        name: 'jailed',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export const hatsProtocolAbi = [
  {
    inputs: [{ internalType: 'uint256', name: '_hatId', type: 'uint256' }],
    name: 'hatSupply',
    outputs: [{ internalType: 'uint32', name: 'supply', type: 'uint32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_hatId', type: 'uint256' }],
    name: 'isActive',
    outputs: [{ internalType: 'bool', name: 'active', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_wearer', type: 'address' },
      { internalType: 'uint256', name: '_hatId', type: 'uint256' }
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;
