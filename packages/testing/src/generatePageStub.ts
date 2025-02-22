import type { Prisma } from '@charmverse/core/prisma';
import { v4 } from 'uuid';

export function pageContentStub(): Pick<Prisma.PageCreateInput, 'content' | 'contentText' | 'hasContent'> {
  return {
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph'
        },
        {
          type: 'paragraph',
          content: [
            {
              text: 'Source: ',
              type: 'text'
            },
            {
              text: 'Wikipedia.com',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin'
                  }
                }
              ]
            }
          ]
        },
        {
          type: 'paragraph'
        },
        {
          type: 'paragraph',
          content: [
            {
              text: 'Bitcoin',
              type: 'text',
              marks: [
                {
                  type: 'bold'
                }
              ]
            },
            {
              text: ' (',
              type: 'text'
            },
            {
              text: 'Abbreviation',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/ISO_4217#Unofficial_codes_for_cryptocurrencies'
                  }
                }
              ]
            },
            {
              text: ': ',
              type: 'text'
            },
            {
              text: 'BTC',
              type: 'text',
              marks: [
                {
                  type: 'bold'
                }
              ]
            },
            {
              text: '; ',
              type: 'text'
            },
            {
              text: 'sign',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Currency_symbol'
                  }
                }
              ]
            },
            {
              text: ': ',
              type: 'text'
            },
            {
              text: '₿',
              type: 'text',
              marks: [
                {
                  type: 'bold'
                }
              ]
            },
            {
              text: ') is a decentralized ',
              type: 'text'
            },
            {
              text: 'digital currency',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Digital_currency'
                  }
                }
              ]
            },
            {
              text: ' that can be transferred on the peer-to-peer ',
              type: 'text'
            },
            {
              text: 'bitcoin network',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin_network'
                  }
                }
              ]
            },
            {
              text: '.',
              type: 'text'
            },
            {
              text: '[7]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-JSC-13'
                  }
                }
              ]
            },
            {
              text: ' Bitcoin transactions are verified by network ',
              type: 'text'
            },
            {
              text: 'nodes',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Node_(networking)'
                  }
                }
              ]
            },
            {
              text: ' through ',
              type: 'text'
            },
            {
              text: 'cryptography',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Cryptography'
                  }
                }
              ]
            },
            {
              text: ' and recorded in a public ',
              type: 'text'
            },
            {
              text: 'distributed ledger',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Distributed_ledger'
                  }
                }
              ]
            },
            {
              text: ' called a ',
              type: 'text'
            },
            {
              text: 'blockchain',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Blockchain'
                  }
                }
              ]
            },
            {
              text: '. The ',
              type: 'text'
            },
            {
              text: 'cryptocurrency',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Cryptocurrency'
                  }
                }
              ]
            },
            {
              text: ' was invented in 2008 by an unknown person or group of people using the name ',
              type: 'text'
            },
            {
              text: 'Satoshi Nakamoto',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Satoshi_Nakamoto'
                  }
                }
              ]
            },
            {
              text: '.',
              type: 'text'
            },
            {
              text: '[10]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-whoissn-16'
                  }
                }
              ]
            },
            {
              text: ' The currency began use in 2009,',
              type: 'text'
            },
            {
              text: '[11]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-NY2011-17'
                  }
                }
              ]
            },
            {
              text: ' when its implementation was released as ',
              type: 'text'
            },
            {
              text: 'open-source software',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Open-source_software'
                  }
                }
              ]
            },
            {
              text: '.',
              type: 'text'
            },
            {
              text: '[6]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-Antonopoulos2014-11'
                  }
                }
              ]
            },
            {
              text: ': ch. 1 ',
              type: 'text'
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              text: 'Bitcoin has been described as an ',
              type: 'text'
            },
            {
              text: 'economic bubble',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Economic_bubble'
                  }
                }
              ]
            },
            {
              text: ' by at least eight ',
              type: 'text'
            },
            {
              text: 'Nobel Memorial Prize in Economic Sciences',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Nobel_Memorial_Prize_in_Economic_Sciences'
                  }
                }
              ]
            },
            {
              text: ' recipients.',
              type: 'text'
            },
            {
              text: '[12]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-4Nobels-18'
                  }
                }
              ]
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              text: 'The word ',
              type: 'text'
            },
            {
              text: 'bitcoin',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                }
              ]
            },
            {
              text: ' was defined in a ',
              type: 'text'
            },
            {
              text: 'white paper',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/White_paper'
                  }
                }
              ]
            },
            {
              text: ' published on 31 October 2008.',
              type: 'text'
            },
            {
              text: '[4]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-paper-7'
                  }
                }
              ]
            },
            {
              text: '[13]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-ageofcr-19'
                  }
                }
              ]
            },
            {
              text: ' It is a ',
              type: 'text'
            },
            {
              text: 'compound',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Compound_(linguistics)'
                  }
                }
              ]
            },
            {
              text: ' of the words ',
              type: 'text'
            },
            {
              text: 'bit',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                },
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bit'
                  }
                }
              ]
            },
            {
              text: ' and ',
              type: 'text'
            },
            {
              text: 'coin',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                },
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Coin'
                  }
                }
              ]
            },
            {
              text: '.',
              type: 'text'
            },
            {
              text: '[14]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-btox-20'
                  }
                }
              ]
            },
            {
              text: ' No uniform convention for ',
              type: 'text'
            },
            {
              text: 'bitcoin',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                }
              ]
            },
            {
              text: ' capitalization exists; some sources use ',
              type: 'text'
            },
            {
              text: 'Bitcoin',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                }
              ]
            },
            {
              text: ', capitalized, to refer to the technology and ',
              type: 'text'
            },
            {
              text: 'network',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Computer_network'
                  }
                }
              ]
            },
            {
              text: ' and ',
              type: 'text'
            },
            {
              text: 'bitcoin',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                }
              ]
            },
            {
              text: ', lowercase, for the unit of account.',
              type: 'text'
            },
            {
              text: '[15]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-capitalization-21'
                  }
                }
              ]
            },
            {
              text: ' ',
              type: 'text'
            },
            {
              text: 'The Wall Street Journal',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                },
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/The_Wall_Street_Journal'
                  }
                }
              ]
            },
            {
              text: ',',
              type: 'text'
            },
            {
              text: '[16]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-22'
                  }
                }
              ]
            },
            {
              text: ' ',
              type: 'text'
            },
            {
              text: 'The Chronicle of Higher Education',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                },
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/The_Chronicle_of_Higher_Education'
                  }
                }
              ]
            },
            {
              text: ',',
              type: 'text'
            },
            {
              text: '[17]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-23'
                  }
                }
              ]
            },
            {
              text: ' and the ',
              type: 'text'
            },
            {
              text: 'Oxford English Dictionary',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                },
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Oxford_English_Dictionary'
                  }
                }
              ]
            },
            {
              text: '[14]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-btox-20'
                  }
                }
              ]
            },
            {
              text: ' advocate the use of lowercase ',
              type: 'text'
            },
            {
              text: 'bitcoin',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                }
              ]
            },
            {
              text: ' in all cases.',
              type: 'text'
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              text: 'The legality of bitcoin ',
              type: 'text'
            },
            {
              text: 'varies by region',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Legality_of_bitcoin_by_country_or_territory'
                  }
                }
              ]
            },
            {
              text: '. Nine countries have fully banned bitcoin use, while a further fifteen have implicitly banned it. A few governments have used bitcoin in some capacity. ',
              type: 'text'
            },
            {
              text: 'El Salvador has adopted Bitcoin',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin_in_El_Salvador'
                  }
                }
              ]
            },
            {
              text: ' as legal tender, although use by merchants remains low. ',
              type: 'text'
            },
            {
              text: 'Ukraine',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Ukraine'
                  }
                }
              ]
            },
            {
              text: ' has accepted cryptocurrency donations to fund the resistance to the ',
              type: 'text'
            },
            {
              text: '2022 Russian invasion',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/2022_Russian_invasion_of_Ukraine'
                  }
                }
              ]
            },
            {
              text: '. ',
              type: 'text'
            },
            {
              text: 'Iran',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Iran'
                  }
                }
              ]
            },
            {
              text: ' has used bitcoin to bypass ',
              type: 'text'
            },
            {
              text: 'sanctions',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Sanctions_against_Iran'
                  }
                }
              ]
            },
            {
              text: '.',
              type: 'text'
            }
          ]
        },
        {
          type: 'paragraph'
        },
        {
          type: 'image',
          attrs: {
            alt: null,
            src: 'https://s3.amazonaws.com/charm.public.dev/user-content/2e086f83-e519-4563-aba8-a521b0e1d84b/3aff036c-0958-4c06-afff-9e0438abb4f4/Bitcoin_Block_Data.png',
            size: 425,
            caption: null
          }
        },
        {
          type: 'paragraph'
        },
        {
          type: 'heading',
          attrs: {
            level: 3
          },
          content: [
            {
              text: 'Transactions',
              type: 'text',
              marks: [
                {
                  type: 'bold'
                }
              ]
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              text: 'See also: ',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                }
              ]
            },
            {
              text: 'Bitcoin network',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                },
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin_network'
                  }
                }
              ]
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              text: 'Transactions are defined using a ',
              type: 'text'
            },
            {
              text: 'Forth',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Forth_(programming_language)'
                  }
                }
              ]
            },
            {
              text: '-like scripting language.',
              type: 'text'
            },
            {
              text: '[6]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-Antonopoulos2014-11'
                  }
                }
              ]
            },
            {
              text: ': ch. 5  Transactions consist of one or more ',
              type: 'text'
            },
            {
              text: 'inputs',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                }
              ]
            },
            {
              text: ' and one or more ',
              type: 'text'
            },
            {
              text: 'outputs',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                }
              ]
            },
            {
              text: '. When a user sends bitcoins, the user designates each address and the amount of bitcoin being sent to that address in an output. To prevent double spending, each input must refer to a previous unspent output in the blockchain.',
              type: 'text'
            },
            {
              text: '[28]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-EconOfBTC-37'
                  }
                }
              ]
            },
            {
              text: ' The use of multiple inputs corresponds to the use of multiple coins in a cash transaction. Since transactions can have multiple outputs, users can send bitcoins to multiple recipients in one transaction. As in a cash transaction, the sum of inputs (coins used to pay) can exceed the intended sum of payments. In such a case, an additional output is used, returning the change back to the payer.',
              type: 'text'
            },
            {
              text: '[28]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-EconOfBTC-37'
                  }
                }
              ]
            },
            {
              text: ' Any input ',
              type: 'text'
            },
            {
              text: 'satoshis',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                }
              ]
            },
            {
              text: ' not accounted for in the transaction outputs become the transaction fee.',
              type: 'text'
            },
            {
              text: '[28]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-EconOfBTC-37'
                  }
                }
              ]
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              text: 'Though transaction fees are optional, miners can choose which transactions to process and prioritize those that pay higher fees.',
              type: 'text'
            },
            {
              text: '[28]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-EconOfBTC-37'
                  }
                }
              ]
            },
            {
              text: ' Miners may choose transactions based on the fee paid relative to their storage size, not the absolute amount of money paid as a fee. These fees are generally measured in ',
              type: 'text'
            },
            {
              text: 'satoshis per byte (sat/b)',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                }
              ]
            },
            {
              text: '. The size of transactions is dependent on the number of inputs used to create the transaction and the number of outputs.',
              type: 'text'
            },
            {
              text: '[6]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-Antonopoulos2014-11'
                  }
                }
              ]
            },
            {
              text: ': ch. 8 ',
              type: 'text'
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              text: 'The blocks in the blockchain were originally limited to 32 ',
              type: 'text'
            },
            {
              text: 'megabytes',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Megabyte'
                  }
                }
              ]
            },
            {
              text: ' in size. The block size limit of one megabyte was introduced by Satoshi Nakamoto in 2010. Eventually, the block size limit of one megabyte created ',
              type: 'text'
            },
            {
              text: 'problems',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin_scalability_problem'
                  }
                }
              ]
            },
            {
              text: ' for transaction processing, such as increasing transaction fees and delayed processing of transactions.',
              type: 'text'
            },
            {
              text: '[29]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-38'
                  }
                }
              ]
            },
            {
              text: ' ',
              type: 'text'
            },
            {
              text: 'Andreas Antonopoulos',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Andreas_Antonopoulos'
                  }
                }
              ]
            },
            {
              text: ' has stated ',
              type: 'text'
            },
            {
              text: 'Lightning Network',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Lightning_Network'
                  }
                }
              ]
            },
            {
              text: ' is a potential scaling solution and referred to lightning as a second-layer routing network.',
              type: 'text'
            },
            {
              text: '[6]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-Antonopoulos2014-11'
                  }
                }
              ]
            },
            {
              text: ': ch. 8 ',
              type: 'text'
            }
          ]
        },
        {
          type: 'paragraph'
        },
        {
          type: 'heading',
          attrs: {
            level: 2
          },
          content: [
            {
              text: 'Mining',
              type: 'text'
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              text: 'See also: ',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                }
              ]
            },
            {
              text: 'Bitcoin network § Mining',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                },
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin_network#Mining'
                  }
                }
              ]
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              text: 'Mining',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                }
              ]
            },
            {
              text: ' is a record-keeping service done through the use of computer ',
              type: 'text'
            },
            {
              text: 'processing power',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Processing_power'
                  }
                }
              ]
            },
            {
              text: '.',
              type: 'text'
            },
            {
              text: '[f]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-51'
                  }
                }
              ]
            },
            {
              text: ' Miners keep the blockchain consistent, complete, and unalterable by repeatedly grouping newly broadcast transactions into a ',
              type: 'text'
            },
            {
              text: 'block',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                }
              ]
            },
            {
              text: ', which is then broadcast to the network and verified by recipient nodes.',
              type: 'text'
            },
            {
              text: '[25]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-econbc-33'
                  }
                }
              ]
            },
            {
              text: ' Each block contains a ',
              type: 'text'
            },
            {
              text: 'SHA-256',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/SHA-256'
                  }
                }
              ]
            },
            {
              text: ' ',
              type: 'text'
            },
            {
              text: 'cryptographic hash',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Cryptographic_hash'
                  }
                }
              ]
            },
            {
              text: ' of the previous block,',
              type: 'text'
            },
            {
              text: '[25]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-econbc-33'
                  }
                }
              ]
            },
            {
              text: ' thus linking it to the previous block and giving the blockchain its name.',
              type: 'text'
            },
            {
              text: '[6]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-Antonopoulos2014-11'
                  }
                }
              ]
            },
            {
              text: ': ch. 7 ',
              type: 'text'
            },
            {
              text: '[25]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-econbc-33'
                  }
                }
              ]
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              text: 'To be accepted by the rest of the network, a new block must contain a ',
              type: 'text'
            },
            {
              text: 'proof-of-work',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                },
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Proof-of-work_system#Bitcoin-type_proof_of_work'
                  }
                }
              ]
            },
            {
              text: ' (PoW).',
              type: 'text'
            },
            {
              text: '[25]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-econbc-33'
                  }
                }
              ]
            },
            {
              text: '[g]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-53'
                  }
                }
              ]
            },
            {
              text: ' The PoW requires miners to find a number called a ',
              type: 'text'
            },
            {
              text: 'nonce',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                },
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Cryptographic_nonce'
                  }
                }
              ]
            },
            {
              text: ' (a number used just once), such that when the block content is ',
              type: 'text'
            },
            {
              text: 'hashed',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Cryptographic_hash'
                  }
                }
              ]
            },
            {
              text: " along with the nonce, the result is numerically smaller than the network's ",
              type: 'text'
            },
            {
              text: 'difficulty target',
              type: 'text',
              marks: [
                {
                  type: 'italic'
                }
              ]
            },
            {
              text: '.',
              type: 'text'
            },
            {
              text: '[6]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-Antonopoulos2014-11'
                  }
                }
              ]
            },
            {
              text: ': ch. 8  This proof is easy for any node in the network to verify, but extremely time-consuming to generate, as for a secure cryptographic hash, miners must try many different nonce values (usually the sequence of tested values is the ascending natural numbers: 0, 1, 2, 3, ...) before a result happens to be less than the difficulty target. Because the difficulty target is extremely small compared to a typical SHA-256 hash, block hashes have many ',
              type: 'text'
            },
            {
              text: 'leading zeros',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Leading_zero'
                  }
                }
              ]
            },
            {
              text: '[6]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-Antonopoulos2014-11'
                  }
                }
              ]
            },
            {
              text: ': ch. 8  as can be seen in this example block hash:',
              type: 'text'
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              text: '0000000000000000000',
              type: 'text',
              marks: [
                {
                  type: 'bold'
                }
              ]
            },
            {
              text: '590fc0f3eba193a278534220b2b37e9849e1a770ca959',
              type: 'text'
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              text: 'By adjusting this difficulty target, the amount of work needed to generate a block can be changed. Every 2,016 blocks (approximately 14 days given roughly 10 minutes per block), nodes deterministically adjust the difficulty target based on the recent rate of block generation, with the aim of keeping the average time between new blocks at ten minutes. In this way the system automatically adapts to the total amount of mining power on the network.',
              type: 'text'
            },
            {
              text: '[6]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-Antonopoulos2014-11'
                  }
                }
              ]
            },
            {
              text: ': ch. 8  As of April 2022, it takes on average 122 sextillion (122 thousand billion billion) attempts to generate a block hash smaller than the difficulty target.',
              type: 'text'
            },
            {
              text: '[41]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-diffhistory-54'
                  }
                }
              ]
            },
            {
              text: ' Computations of this magnitude are extremely expensive and utilize specialized hardware.',
              type: 'text'
            },
            {
              text: '[42]',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Bitcoin#cite_note-55'
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    contentText:
      "Source: Wikipedia.comBitcoin (Abbreviation: BTC; sign: ₿) is a decentralized digital currency that can be transferred on the peer-to-peer bitcoin network.[7] Bitcoin transactions are verified by network nodes through cryptography and recorded in a public distributed ledger called a blockchain. The cryptocurrency was invented in 2008 by an unknown person or group of people using the name Satoshi Nakamoto.[10] The currency began use in 2009,[11] when its implementation was released as open-source software.[6]: ch. 1 Bitcoin has been described as an economic bubble by at least eight Nobel Memorial Prize in Economic Sciences recipients.[12]The word bitcoin was defined in a white paper published on 31 October 2008.[4][13] It is a compound of the words bit and coin.[14] No uniform convention for bitcoin capitalization exists; some sources use Bitcoin, capitalized, to refer to the technology and network and bitcoin, lowercase, for the unit of account.[15] The Wall Street Journal,[16] The Chronicle of Higher Education,[17] and the Oxford English Dictionary[14] advocate the use of lowercase bitcoin in all cases.The legality of bitcoin varies by region. Nine countries have fully banned bitcoin use, while a further fifteen have implicitly banned it. A few governments have used bitcoin in some capacity. El Salvador has adopted Bitcoin as legal tender, although use by merchants remains low. Ukraine has accepted cryptocurrency donations to fund the resistance to the 2022 Russian invasion. Iran has used bitcoin to bypass sanctions.TransactionsSee also: Bitcoin networkTransactions are defined using a Forth-like scripting language.[6]: ch. 5  Transactions consist of one or more inputs and one or more outputs. When a user sends bitcoins, the user designates each address and the amount of bitcoin being sent to that address in an output. To prevent double spending, each input must refer to a previous unspent output in the blockchain.[28] The use of multiple inputs corresponds to the use of multiple coins in a cash transaction. Since transactions can have multiple outputs, users can send bitcoins to multiple recipients in one transaction. As in a cash transaction, the sum of inputs (coins used to pay) can exceed the intended sum of payments. In such a case, an additional output is used, returning the change back to the payer.[28] Any input satoshis not accounted for in the transaction outputs become the transaction fee.[28]Though transaction fees are optional, miners can choose which transactions to process and prioritize those that pay higher fees.[28] Miners may choose transactions based on the fee paid relative to their storage size, not the absolute amount of money paid as a fee. These fees are generally measured in satoshis per byte (sat/b). The size of transactions is dependent on the number of inputs used to create the transaction and the number of outputs.[6]: ch. 8 The blocks in the blockchain were originally limited to 32 megabytes in size. The block size limit of one megabyte was introduced by Satoshi Nakamoto in 2010. Eventually, the block size limit of one megabyte created problems for transaction processing, such as increasing transaction fees and delayed processing of transactions.[29] Andreas Antonopoulos has stated Lightning Network is a potential scaling solution and referred to lightning as a second-layer routing network.[6]: ch. 8 MiningSee also: Bitcoin network § MiningMining is a record-keeping service done through the use of computer processing power.[f] Miners keep the blockchain consistent, complete, and unalterable by repeatedly grouping newly broadcast transactions into a block, which is then broadcast to the network and verified by recipient nodes.[25] Each block contains a SHA-256 cryptographic hash of the previous block,[25] thus linking it to the previous block and giving the blockchain its name.[6]: ch. 7 [25]To be accepted by the rest of the network, a new block must contain a proof-of-work (PoW).[25][g] The PoW requires miners to find a number called a nonce (a number used just once), such that when the block content is hashed along with the nonce, the result is numerically smaller than the network's difficulty target.[6]: ch. 8  This proof is easy for any node in the network to verify, but extremely time-consuming to generate, as for a secure cryptographic hash, miners must try many different nonce values (usually the sequence of tested values is the ascending natural numbers: 0, 1, 2, 3, ...) before a result happens to be less than the difficulty target. Because the difficulty target is extremely small compared to a typical SHA-256 hash, block hashes have many leading zeros[6]: ch. 8  as can be seen in this example block hash:0000000000000000000590fc0f3eba193a278534220b2b37e9849e1a770ca959By adjusting this difficulty target, the amount of work needed to generate a block can be changed. Every 2,016 blocks (approximately 14 days given roughly 10 minutes per block), nodes deterministically adjust the difficulty target based on the recent rate of block generation, with the aim of keeping the average time between new blocks at ten minutes. In this way the system automatically adapts to the total amount of mining power on the network.[6]: ch. 8  As of April 2022, it takes on average 122 sextillion (122 thousand billion billion) attempts to generate a block hash smaller than the difficulty target.[41] Computations of this magnitude are extremely expensive and utilize specialized hardware.[42]",
    hasContent: true
  };
}

/**
 * A page stub with a significant amount of content
 */
export function pageStubToCreate({
  id,
  parentId,
  createdBy,
  spaceId,
  deletedAt,
  title,
  path
}: {
  path?: string;
  id?: string;
  createdBy: string;
  spaceId: string;
  parentId?: string;
  deletedAt?: Date;
  title?: string;
}): Prisma.PageCreateManyInput {
  const pageContent = pageContentStub();

  const pageId = id ?? v4();

  return {
    id: pageId ?? v4(),
    deletedAt,
    createdBy,
    updatedBy: createdBy,
    spaceId,
    updatedAt: '2022-09-14T14:13:05.326Z',
    title: title ?? `Page ${pageId}`,
    headerImage: null,
    icon: '📚',
    path: path ?? `page-${v4()}`,
    isTemplate: false,
    parentId,
    type: 'page',
    index: -1,
    fullWidth: false,
    ...pageContent
  };
}
