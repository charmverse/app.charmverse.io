import { Page, Space, User } from '@prisma/client';
import { LoggedInUser, PopulatedUser, PageContent } from 'models';

export const spaces: Space[] = [
  { id: '0', name: 'Our Community', domain: 'demo' },
  { id: '1', name: 'My Workspace', domain: 'my-workspace' }
].map(space => MockSpace(space));

function MockSpace (partial: Partial<Space>): Space {
  return {
    id: `${Math.random()}`,
    domain: '',
    name: '',
    createdAt: new Date(),
    createdBy: '0x87ddfh6g435D12CE393aBbA3f81fe6C594543sdw',
    deletedAt: null,
    updatedAt: new Date(),
    updatedBy: '0x87ddfh6g435D12CE393aBbA3f81fe6C594543sdw',
    ...partial
  };
}

export const users: PopulatedUser[] = [
  { id: '0', addresses: ['0x87ddfh6g435D12CE393aBbA3f81fe6C594543sdw'], spaceRoles: [{ spaceId: spaces[0].id, role: 'admin' as const, userId: '0' }, { spaceId: spaces[1].id, role: 'admin' as const, userId: '0' }] },
  { id: '1', addresses: ['0x1416d1b5435D12CE393aBbA3f81fe6C5951e4Bf4'], spaceRoles: [{ spaceId: spaces[0].id, role: 'admin' as const, userId: '1' }] },
  { id: '2', addresses: ['0x626a827c90AA620CFD78A8ecda494Edb9a4225D5'], spaceRoles: [{ spaceId: spaces[0].id, role: 'contributor' as const, userId: '2' }, { spaceId: spaces[1].id, role: 'admin' as const, userId: '2' }] },
  { id: '3', addresses: ['0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2'], spaceRoles: [{ spaceId: spaces[1].id, role: 'contributor' as const, userId: '3' }] }
].map(user => MockUser(user));

function MockUser (partial: Partial<PopulatedUser>): PopulatedUser {
  return {
    addresses: [],
    spaceRoles: [],
    discordId: null,
    id: `${Math.random()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial
  };
}

export const activeUser: LoggedInUser = {
  ...users[0],
  isLoading: false,
  linkedAddressesCount: 1,
  favorites: []
};

function MockPage (partial: Partial<Page>): Page {
  const author = partial.createdBy || users[0].addresses[0];
  const id = Math.random().toString(36).substring(2);
  return {
    createdAt: new Date(),
    createdBy: author,
    deletedAt: null,
    updatedAt: new Date(),
    updatedBy: author,
    headerImage: null,
    icon: null,
    boardId: null,
    id,
    type: 'page',
    title: '',
    content: {
      type: 'doc',
      content: []
    }, // as PageContent,
    contentString: '',
    isPublic: false,
    parentId: null,
    path: id,
    spaceId: null,
    ...partial
  };
}

export const pages: Page[] = [
  MockPage({
    id: '0',
    icon: '📌',
    content: gettingStartedPageContent(),
    path: 'getting-started',
    spaceId: '0',
    title: 'Getting Started'
  }),
  MockPage({
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello World'
            }
          ]
        }
      ]
    },
    parentId: '0',
    path: 'nested-page',
    spaceId: '0',
    title: 'Nested Page'
  }),
  MockPage({
    path: 'third-page',
    spaceId: '0',
    title: 'Another Top-level Page'
  }),
  MockPage({
    path: 'database-page',
    spaceId: '0',
    title: 'Board page',
    type: 'board',
    boardId: 'b3fs1cyw717nfjfswcyk9hd1jph'
  }),
  MockPage({
    icon: '📌',
    content: getPageContent(),
    path: 'fifth-page',
    spaceId: '1',
    title: 'Getting Started Again'
  })
];

function gettingStartedPageContent (): PageContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '👋 Welcome to your workspace!'
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 3,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Some basics to get you started'
          }
        ]
      },
      {
        type: 'bulletList',
        attrs: {
          tight: false
        },
        content: [
          {
            type: 'listItem',
            attrs: {
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Click anywhere and just start typing'
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            attrs: {
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Use '
                  },
                  {
                    type: 'text',
                    marks: [
                      {
                        type: 'code'
                      }
                    ],
                    text: '/'
                  },
                  {
                    type: 'text',
                    text: ' to see the different styles and content you can create - bold, italics, tables, task lists, images, videos, etc'
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            attrs: {
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Use '
                  },
                  {
                    type: 'text',
                    marks: [
                      {
                        type: 'code'
                      }
                    ],
                    text: ':'
                  },
                  {
                    type: 'text',
                    text: ' for inserting emojis. Use '
                  },
                  {
                    type: 'text',
                    marks: [
                      {
                        type: 'code'
                      }
                    ],
                    text: '@'
                  },
                  {
                    type: 'text',
                    text: ' for mentioning people'
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            attrs: {
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Use '
                  },
                  {
                    type: 'text',
                    marks: [
                      {
                        type: 'code'
                      }
                    ],
                    text: '+'
                  },
                  {
                    type: 'text',
                    text: ' button in the sidebar to add new pages'
                  }
                ]
              }
            ]
          }

        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 3,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'See how it works'
          }
        ]
      },
      {
        type: 'blockquote',
        attrs: {
          emoji: '👉🏼'
        },
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                marks: [
                  {
                    type: 'bold'
                  }
                ],
                text: 'Questions?'
              },
              {
                type: 'text',
                text: ' Email us at '
              },
              {
                type: 'text',
                marks: [
                  {
                    type: 'code'
                  }
                ],
                text: 'hello@charmverse.io'
              },
              {
                type: 'text',
                text: 'or join our community in '
              },
              {
                type: 'text',
                marks: [
                  {
                    type: 'link',
                    attrs: {
                      href: 'https://discord.gg/n8VU9pAm'
                    }
                  }
                ],
                text: 'Discord'
              }
            ]
          }
        ]
      }
    ]
  };
}

function getPageContent (): PageContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'H2 Heading'
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 3,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'H3 Heading'
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Marks'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            marks: [
              {
                type: 'italic'
              }
            ],
            text: 'italic'
          },
          {
            type: 'text',
            text: ', '
          },
          {
            type: 'text',
            marks: [
              {
                type: 'bold'
              }
            ],
            text: 'Bold'
          },
          {
            type: 'text',
            text: ', '
          },
          {
            type: 'text',
            marks: [
              {
                type: 'italic'
              }
            ],
            text: 'underlined'
          },
          {
            type: 'text',
            text: ', '
          },
          {
            type: 'text',
            marks: [
              {
                type: 'strike'
              }
            ],
            text: 'striked'
          },
          {
            type: 'text',
            text: ', '
          },
          {
            type: 'text',
            marks: [
              {
                type: 'code'
              }
            ],
            text: 'code'
          },
          {
            type: 'text',
            text: ', '
          },
          {
            type: 'text',
            marks: [
              {
                type: 'link',
                attrs: {
                  href: 'https://en.wikipedia.org/wiki/Main_Page'
                }
              }
            ],
            text: 'link'
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Simple Table'
          }
        ]
      },
      {
        type: 'table',
        content: [
          {
            type: 'table_row',
            content: [
              {
                type: 'table_header',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'col1'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'table_header',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'col2'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'table_header',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'col3'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            type: 'table_row',
            content: [
              {
                type: 'table_cell',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'row 1 col 1'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'table_cell',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'row 1 col 2'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'table_cell',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'row 1 col 3'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            type: 'table_row',
            content: [
              {
                type: 'table_cell',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'row 2 col 1'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'table_cell',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'row 2 col 2'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'table_cell',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  align: 'left',
                  background: null
                },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'row 2 col 3'
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'GFM Todo Lists'
          }
        ]
      },
      {
        type: 'bulletList',
        attrs: {
          tight: false
        },
        content: [
          {
            type: 'listItem',
            attrs: {
              todoChecked: true
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Check out BangleJS'
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            attrs: {
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Walk the cat'
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            attrs: {
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Drag these lists by dragging the square up or down.'
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            attrs: {
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Move these lists with shortcut '
                  },
                  {
                    type: 'text',
                    marks: [
                      {
                        type: 'code'
                      }
                    ],
                    text: 'Option-ArrowUp'
                  },
                  {
                    type: 'text',
                    text: '. You can move any node (yes headings too) with this shortcut.'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Unordered Lists'
          }
        ]
      },
      {
        type: 'bulletList',
        attrs: {
          tight: false
        },
        content: [
          {
            type: 'listItem',
            attrs: {
              todoChecked: null
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'This is an ordered list'
                  }
                ]
              },
              {
                type: 'bulletList',
                attrs: {
                  tight: false
                },
                content: [
                  {
                    type: 'listItem',
                    attrs: {
                      todoChecked: null
                    },
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          {
                            type: 'text',
                            text: 'I am a nested ordered list'
                          }
                        ]
                      }
                    ]
                  },
                  {
                    type: 'listItem',
                    attrs: {
                      todoChecked: null
                    },
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          {
                            type: 'text',
                            text: 'I am another nested one'
                          }
                        ]
                      },
                      {
                        type: 'bulletList',
                        attrs: {
                          tight: true
                        },
                        content: [
                          {
                            type: 'listItem',
                            attrs: {
                              todoChecked: null
                            },
                            content: [
                              {
                                type: 'paragraph',
                                content: [
                                  {
                                    type: 'text',
                                    text: 'Bunch of nesting right?'
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Ordered Lists'
          }
        ]
      },
      {
        type: 'orderedList',
        attrs: {
          order: 1,
          tight: false
        },
        content: [
          {
            type: 'listItem',
            attrs: {
              todoChecked: null
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Bringing order to the world.'
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            attrs: {
              todoChecked: null
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Nobody remembers who came second.'
                  }
                ]
              },
              {
                type: 'orderedList',
                attrs: {
                  order: 1,
                  tight: false
                },
                content: [
                  {
                    type: 'listItem',
                    attrs: {
                      todoChecked: null
                    },
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          {
                            type: 'text',
                            text: 'We can cheat to become first by nesting.'
                          }
                        ]
                      },
                      {
                        type: 'bulletList',
                        attrs: {
                          tight: true
                        },
                        content: [
                          {
                            type: 'listItem',
                            attrs: {
                              todoChecked: null
                            },
                            content: [
                              {
                                type: 'paragraph',
                                content: [
                                  {
                                    type: 'text',
                                    text: 'Oh an you can mix and match ordered unordered.'
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Image'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'You can also directly paste images.\n'
          },
          {
            type: 'image',
            attrs: {
              src: 'https://user-images.githubusercontent.com/6966254/101979122-f4405e80-3c0e-11eb-9bf8-9af9b1ddc94f.png',
              alt: null,
              title: null
            }
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Blockquote'
          }
        ]
      },
      {
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'I am a blockquote, trigger me by typing > on a new line'
              }
            ]
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Code Block'
          }
        ]
      },
      {
        type: 'codeBlock',
        attrs: {
          language: ''
        },
        content: [
          {
            type: 'text',
            text: "// This is a code block\nfunction foo() {\n  console.log('Hello world!')\n}"
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Paragraph'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'I am a boring paragraph'
          }
        ]
      },
      {
        type: 'heading',
        attrs: {
          level: 2,
          collapseContent: null
        },
        content: [
          {
            type: 'text',
            text: 'Horizontal Break'
          }
        ]
      },
      {
        type: 'horizontalRule'
      }
    ]
  };
}

export const blocks = JSON.parse('[{"id":"vk5d6td6tzpdfibtabuzjgwk88r","schema":1,"workspaceId":"0","parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"view","fields":{"viewType":"board","sortOptions":[],"visiblePropertyIds":[],"visibleOptionIds":[],"hiddenOptionIds":[],"collapsedOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":["ctf1jbxhgmi85bg67pdzusyebhw","cjoke918aqbrzu8a78onszkpipw","7s14ecncef7apnhpc7jpmmac1sh","cyuidkfsy43rzubzfohx8demtcw","71ffp1rss8b9z1mej8t8gomdxeo"],"columnWidths":{},"columnCalculations":{},"kanbanCalculations":{},"defaultTemplateId":""},"title":"Board View","createAt":1643733258753,"updateAt":1643733303218,"deleteAt":0},{"id":"cyuidkfsy43rzubzfohx8demtcw","schema":1,"workspaceId":"0","parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"🌳","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"dabadd9b-adf1-4d9f-8702-805ac6cef602"},"contentOrder":[],"isTemplate":false},"title":"Gardening","createAt":1643733258755,"updateAt":1643736454792,"deleteAt":0},{"id":"c53orcju38jggmcadh7ja74yp1a","schema":1,"workspaceId":"0","parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"34eb9c25-d5bf-49d9-859e-f74f4e0030e7"},"contentOrder":[],"isTemplate":true},"title":"New Task","createAt":1643733258757,"updateAt":1643733258757,"deleteAt":0},{"id":"ctf1jbxhgmi85bg67pdzusyebhw","schema":1,"workspaceId":"0","parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"🐱","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"d37a61f4-f332-4db9-8b2d-5e0a91aa20ed"},"contentOrder":[],"isTemplate":false},"title":"Feed Fluffy","createAt":1643733258758,"updateAt":1643733262451,"deleteAt":0},{"id":"b3fs1cyw717nfjfswcyk9hd1jph","schema":1,"workspaceId":"0","parentId":"","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"board","fields":{"showDescription":false,"description":"","icon":"😄","isTemplate":false,"columnCalculations":[],"cardProperties":[{"id":"d777ba3b-8728-40d1-87a6-59406bbbbfb0","name":"Status","type":"select","options":[{"color":"propColorPink","id":"34eb9c25-d5bf-49d9-859e-f74f4e0030e7","value":"To Do!!"},{"color":"propColorYellow","id":"d37a61f4-f332-4db9-8b2d-5e0a91aa20ed","value":"Doing"},{"color":"propColorGreen","id":"dabadd9b-adf1-4d9f-8702-805ac6cef602","value":"Done 🙌"}]}]},"title":"Personal Tasks","createAt":1643733258760,"updateAt":1643736587752,"deleteAt":0},{"id":"cjoke918aqbrzu8a78onszkpipw","schema":1,"workspaceId":"0","parentId":"b3fs1cyw717nfjfswcyk9hd1jph","rootId":"b3fs1cyw717nfjfswcyk9hd1jph","createdBy":"uoounhrzr1irztg5igxmseh9n8o","modifiedBy":"uoounhrzr1irztg5igxmseh9n8o","type":"card","fields":{"icon":"👣","properties":{"d777ba3b-8728-40d1-87a6-59406bbbbfb0":"34eb9c25-d5bf-49d9-859e-f74f4e0030e7"},"contentOrder":[],"isTemplate":false},"title":"Go for a walk","createAt":1643733258761,"updateAt":1643733258761,"deleteAt":0}]');
