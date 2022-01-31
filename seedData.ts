import { Contributor, Page, PageContent, Space } from 'models';

export const spaces: Space[] = [
  { id: '0', name: 'Our Community', domain: 'demo' },
  { id: '1', name: 'My Workspace', domain: 'my-workspace' }
];

export const contributors: Contributor[] = [
  { id: '0', address: '0x87ddfh6g435D12CE393aBbA3f81fe6C594543sdw', favorites: [], username: 'dolemite', spaceRoles: [{ spaceId: spaces[0].id, type: 'admin', userId: '0' }, { spaceId: spaces[1].id, type: 'admin', userId: '0' }] },
  { id: '1', address: '0x1416d1b5435D12CE393aBbA3f81fe6C5951e4Bf4', favorites: [], username: 'cerberus', spaceRoles: [{ spaceId: spaces[0].id, type: 'admin', userId: '1' }] },
  { id: '2', address: '0x626a827c90AA620CFD78A8ecda494Edb9a4225D5', favorites: [], username: 'devorein', spaceRoles: [{ spaceId: spaces[0].id, type: 'contributor', userId: '2' }, { spaceId: spaces[1].id, type: 'admin', userId: '2' }] },
  { id: '3', address: '0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2', favorites: [], username: 'mattopoly', spaceRoles: [{ spaceId: spaces[1].id, type: 'contributor', userId: '3' }] }
];

export const activeUser = contributors[0];

export const pages: Page[] = [
  { id: '0', icon: '📌', created: new Date(), content: gettingStartedPageContent(), isPublic: false, path: 'first-page', spaceId: '0', title: 'Getting Started', parentId: null },
  {
    id: '1',
    created: new Date(),
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
    isPublic: false,
    path: 'second-page',
    spaceId: '0',
    title: 'Nested Page'
  },
  {
    id: '2',
    created: new Date(),
    content: {
      type: 'doc',
      content: []
    },
    isPublic: false,
    parentId: null,
    path: 'third-page',
    spaceId: '0',
    title: 'Another Top-level Page'
  },
  {
    id: '3',
    created: new Date(),
    content: {
      type: 'doc',
      content: []
    },
    isPublic: false,
    parentId: null,
    path: 'fourth-page',
    spaceId: '0',
    title: 'Fourth page'
  },
  { id: '4', icon: '📌', created: new Date(), content: getPageContent(), isPublic: false, path: 'fifth-page', spaceId: '1', title: 'Getting Started Again', parentId: null }
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
