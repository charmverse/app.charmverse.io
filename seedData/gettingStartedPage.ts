import type { Page } from '@prisma/client';

export const gettingStartedPage: Pick<
  Page,
  'title' | 'icon' | 'headerImage' | 'hasContent' | 'content' | 'contentText' | 'type' | 'index' | 'version'
> = {
  title: 'Getting Started',
  hasContent: true,
  headerImage:
    'https://s3.amazonaws.com/charm.public/user-content/e5dba747-be62-49be-a7ba-71cf27b17174/425d95c8-59c9-48bb-9970-3a21ef43efdc/home_banner.jpg',
  icon: '🧑‍🚀',
  type: 'page',
  index: 0,
  version: 1,
  content: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: {
          level: 1,
          track: [],
          collapseContent: null
        },
        content: [
          {
            type: 'emoji',
            attrs: {
              emoji: '👋'
            }
          },
          {
            text: ' ',
            type: 'text'
          },
          {
            text: 'Welcome to CharmVerse!',
            type: 'text',
            marks: [
              {
                type: 'insertion',
                attrs: {
                  date: '2022-12-21T14:50:00.000Z',
                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                  approved: true,
                  username: 'Drea | CharmVerse'
                }
              },
              {
                type: 'text-color',
                attrs: {
                  color: 'blue',
                  bgColor: ''
                }
              }
            ]
          }
        ]
      },
      {
        type: 'paragraph',
        attrs: {
          track: []
        },
        content: [
          {
            text: 'A web3 community platform. ',
            type: 'text',
            marks: [
              {
                type: 'italic'
              },
              {
                type: 'insertion',
                attrs: {
                  date: '2022-12-22T16:00:00.000Z',
                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                  approved: true,
                  username: 'Drea | CharmVerse'
                }
              }
            ]
          },
          {
            text: 'Powering the Future of Work through Web3. The solution for token communities to build relationships, work together and vote.',
            type: 'text',
            marks: [
              {
                type: 'italic'
              },
              {
                type: 'insertion',
                attrs: {
                  date: '2022-12-22T16:00:00.000Z',
                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                  approved: true,
                  username: 'Drea | CharmVerse'
                }
              },
              {
                type: 'text-color',
                attrs: {
                  color: null,
                  bgColor: null
                }
              }
            ]
          }
        ]
      },
      {
        type: 'paragraph',
        attrs: {
          track: []
        }
      },
      {
        type: 'horizontalRule',
        attrs: {
          track: []
        }
      },
      {
        type: 'blockquote',
        attrs: {
          emoji: '👇',
          track: []
        },
        content: [
          {
            type: 'paragraph',
            attrs: {
              track: []
            },
            content: [
              {
                text: 'Here are the basics:',
                type: 'text',
                marks: [
                  {
                    type: 'bold'
                  },
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2022-12-21T15:20:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  },
                  {
                    type: 'text-color',
                    attrs: {
                      color: 'teal',
                      bgColor: ''
                    }
                  }
                ]
              }
            ]
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
              track: [],
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                attrs: {
                  track: []
                },
                content: [
                  {
                    text: 'Click anywhere and just start typing',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
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
        type: 'bulletList',
        attrs: {
          tight: false
        },
        content: [
          {
            type: 'listItem',
            attrs: {
              track: [],
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                attrs: {
                  track: []
                },
                content: [
                  {
                    text: 'Hit ',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: '/',
                    type: 'text',
                    marks: [
                      {
                        type: 'code'
                      }
                    ]
                  },
                  {
                    text: ' to see all the types of content you can add - head',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: 'ings',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:30:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: ', videos, ',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: 'tweets, ',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T16:20:00.000Z',
                          user: 'd5b4e5db-868d-47b0-bc78-ebe9b5b2c835',
                          approved: true,
                          username: '0x3B60…a43F'
                        }
                      }
                    ]
                  },
                  {
                    text: 'sub pages, etc.',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
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
        type: 'paragraph',
        attrs: {
          track: []
        },
        content: [
          {
            type: 'tabIndent',
            marks: [
              {
                type: 'insertion',
                attrs: {
                  date: '2022-12-22T16:20:00.000Z',
                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                  approved: true,
                  username: 'Drea | CharmVerse'
                }
              }
            ]
          },
          {
            text: 'Give it a go. Hit ',
            type: 'text',
            marks: [
              {
                type: 'insertion',
                attrs: {
                  date: '2022-12-22T16:20:00.000Z',
                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                  approved: true,
                  username: 'Drea | CharmVerse'
                }
              },
              {
                type: 'text-color',
                attrs: {
                  color: 'default',
                  bgColor: ''
                }
              }
            ]
          },
          {
            text: '/',
            type: 'text',
            marks: [
              {
                type: 'code'
              }
            ]
          },
          {
            text: ' and insert a new ',
            type: 'text',
            marks: [
              {
                type: 'text-color',
                attrs: {
                  color: 'default',
                  bgColor: ''
                }
              }
            ]
          },
          {
            text: 'sub ',
            type: 'text',
            marks: [
              {
                type: 'insertion',
                attrs: {
                  date: '2022-12-22T16:20:00.000Z',
                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                  approved: true,
                  username: 'Drea | CharmVerse'
                }
              },
              {
                type: 'text-color',
                attrs: {
                  color: 'default',
                  bgColor: ''
                }
              }
            ]
          },
          {
            text: 'page here',
            type: 'text',
            marks: [
              {
                type: 'text-color',
                attrs: {
                  color: 'default',
                  bgColor: ''
                }
              }
            ]
          },
          {
            text: ' ',
            type: 'text',
            marks: [
              {
                type: 'insertion',
                attrs: {
                  date: '2022-12-22T16:20:00.000Z',
                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                  approved: true,
                  username: 'Drea | CharmVerse'
                }
              },
              {
                type: 'text-color',
                attrs: {
                  color: 'default',
                  bgColor: ''
                }
              }
            ]
          },
          {
            type: 'emoji',
            attrs: {
              emoji: '➡️'
            },
            marks: [
              {
                type: 'text-color',
                attrs: {
                  color: 'default',
                  bgColor: ''
                }
              }
            ]
          },
          {
            text: ' ',
            type: 'text',
            marks: [
              {
                type: 'insertion',
                attrs: {
                  date: '2022-12-22T16:30:00.000Z',
                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                  approved: true,
                  username: 'Drea | CharmVerse'
                }
              },
              {
                type: 'text-color',
                attrs: {
                  color: 'default',
                  bgColor: ''
                }
              }
            ]
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
              track: [],
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                attrs: {
                  track: []
                },
                content: [
                  {
                    text: 'Hit ',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-22T16:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: ':',
                    type: 'text',
                    marks: [
                      {
                        type: 'code'
                      }
                    ]
                  },
                  {
                    text: ' to add an emoji. ',
                    type: 'text'
                  },
                  {
                    text: 'Go ahead and add your favorite emoji here ',
                    type: 'text',
                    marks: [
                      {
                        type: 'text-color',
                        attrs: {
                          color: 'default',
                          bgColor: ''
                        }
                      }
                    ]
                  },
                  {
                    type: 'emoji',
                    attrs: {
                      emoji: '➡️'
                    },
                    marks: [
                      {
                        type: 'text-color',
                        attrs: {
                          color: 'default',
                          bgColor: ''
                        }
                      }
                    ]
                  },
                  {
                    text: ' ',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-22T16:30:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      },
                      {
                        type: 'text-color',
                        attrs: {
                          color: 'default',
                          bgColor: ''
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            attrs: {
              track: [],
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                attrs: {
                  track: []
                },
                content: [
                  {
                    text: 'Highlight any text, and use the menu that pops up to ',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: 'style',
                    type: 'text',
                    marks: [
                      {
                        type: 'bold'
                      },
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: ' ',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: 'your',
                    type: 'text',
                    marks: [
                      {
                        type: 'italic'
                      },
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: ' ',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: 'writing',
                    type: 'text',
                    marks: [
                      {
                        type: 'strike'
                      },
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: ' ',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: 'however',
                    type: 'text',
                    marks: [
                      {
                        type: 'code'
                      }
                    ]
                  },
                  {
                    text: ' ',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: 'you',
                    type: 'text',
                    marks: [
                      {
                        type: 'link',
                        attrs: {
                          href: 'https://www.notion.so/product'
                        }
                      },
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: ' like',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
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
        type: 'paragraph',
        attrs: {
          track: []
        },
        content: [
          {
            type: 'tabIndent',
            marks: [
              {
                type: 'insertion',
                attrs: {
                  date: '2022-12-22T16:20:00.000Z',
                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                  approved: true,
                  username: 'Drea | CharmVerse'
                }
              }
            ]
          },
          {
            text: 'Highlight this text and turn it into a Callout with a fire emoji.',
            type: 'text',
            marks: [
              {
                type: 'insertion',
                attrs: {
                  date: '2022-12-22T16:20:00.000Z',
                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                  approved: true,
                  username: 'Drea | CharmVerse'
                }
              },
              {
                type: 'text-color',
                attrs: {
                  color: 'default',
                  bgColor: ''
                }
              }
            ]
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
              track: [],
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                attrs: {
                  track: []
                },
                content: [
                  {
                    text: 'See the ',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: '⋮⋮',
                    type: 'text',
                    marks: [
                      {
                        type: 'code'
                      }
                    ]
                  },
                  {
                    text: ' to the left of this checkbox on hover?',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: ' ',
                    type: 'text',
                    marks: [
                      {
                        type: 'inline-comment',
                        attrs: {
                          id: '3ca23b78-4859-4366-8cf8-66cebfff9d36',
                          resolved: true
                        }
                      },
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: 'Click and drag to move this line',
                    type: 'text',
                    marks: [
                      {
                        type: 'inline-comment',
                        attrs: {
                          id: '3ca23b78-4859-4366-8cf8-66cebfff9d36',
                          resolved: true
                        }
                      },
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      },
                      {
                        type: 'text-color',
                        attrs: {
                          color: 'default',
                          bgColor: ''
                        }
                      }
                    ]
                  },
                  {
                    text: '.',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-22T16:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      },
                      {
                        type: 'text-color',
                        attrs: {
                          color: 'default',
                          bgColor: ''
                        }
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
        type: 'bulletList',
        attrs: {
          tight: false
        },
        content: [
          {
            type: 'listItem',
            attrs: {
              track: [],
              todoChecked: false
            },
            content: [
              {
                type: 'paragraph',
                attrs: {
                  track: []
                },
                content: [
                  {
                    text: 'Hover over ',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-22T15:30:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      },
                      {
                        type: 'text-color',
                        attrs: {
                          color: 'default',
                          bgColor: ''
                        }
                      }
                    ]
                  },
                  {
                    text: 'SPACE',
                    type: 'text',
                    marks: [
                      {
                        type: 'bold'
                      },
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-22T15:30:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      },
                      {
                        type: 'text-color',
                        attrs: {
                          color: '',
                          bgColor: 'gray'
                        }
                      }
                    ]
                  },
                  {
                    text: ' in your sidebar and c',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-22T15:30:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      },
                      {
                        type: 'text-color',
                        attrs: {
                          color: 'default',
                          bgColor: ''
                        }
                      }
                    ]
                  },
                  {
                    text: 'lick the ',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      },
                      {
                        type: 'text-color',
                        attrs: {
                          color: 'default',
                          bgColor: ''
                        }
                      }
                    ]
                  },
                  {
                    text: '+',
                    type: 'text',
                    marks: [
                      {
                        type: 'code'
                      }
                    ]
                  },
                  {
                    text: ' ',
                    type: 'text',
                    marks: [
                      {
                        type: 'bold'
                      },
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      },
                      {
                        type: 'text-color',
                        attrs: {
                          color: 'default',
                          bgColor: ''
                        }
                      }
                    ]
                  },
                  {
                    text: 'button to add a new page',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      },
                      {
                        type: 'text-color',
                        attrs: {
                          color: 'default',
                          bgColor: ''
                        }
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
        type: 'disclosureDetails',
        content: [
          {
            type: 'disclosureSummary',
            content: [
              {
                type: 'paragraph',
                attrs: {
                  track: []
                },
                content: [
                  {
                    text: 'This is a toggle block. ',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:30:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: 'Click the little triangle to see more useful tips!',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2022-12-21T15:30:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      },
                      {
                        type: 'text-color',
                        attrs: {
                          color: 'default',
                          bgColor: ''
                        }
                      }
                    ]
                  }
                ]
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
                  track: [],
                  todoChecked: null
                },
                content: [
                  {
                    type: 'paragraph',
                    attrs: {
                      track: []
                    },
                    content: [
                      {
                        text: 'How it works',
                        type: 'text',
                        marks: [
                          {
                            type: 'link',
                            attrs: {
                              href: 'https://www.charmverse.io/how-it-works'
                            }
                          },
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-22T15:50:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ' ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-22T15:50:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ": Learn about CharmVerse's cool web3 features like",
                        type: 'text'
                      },
                      {
                        text: ' ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2023-01-27T17:50:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: 'Forum',
                        type: 'text',
                        marks: [
                          {
                            type: 'link',
                            attrs: {
                              href: 'https://www.charmverse.io/forum'
                            }
                          },
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2023-01-27T17:50:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ',',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2023-01-27T17:50:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ' ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-22T16:40:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: 'Proposal Builder',
                        type: 'text',
                        marks: [
                          {
                            type: 'link',
                            attrs: {
                              href: 'https://www.charmverse.io/proposal-builder'
                            }
                          }
                        ]
                      },
                      {
                        text: ', Bounties, ',
                        type: 'text'
                      },
                      {
                        text: 'and ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-30T15:40:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: 'Member Directory',
                        type: 'text',
                        marks: [
                          {
                            type: 'link',
                            attrs: {
                              href: 'https://www.charmverse.io/member-directory'
                            }
                          }
                        ]
                      },
                      {
                        text: '. You will find shortcuts to these features at the top of your sidebar.',
                        type: 'text'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'listItem',
                attrs: {
                  track: [],
                  todoChecked: null
                },
                content: [
                  {
                    type: 'paragraph',
                    attrs: {
                      track: []
                    },
                    content: [
                      {
                        text: 'Solutions',
                        type: 'text',
                        marks: [
                          {
                            type: 'link',
                            attrs: {
                              href: 'https://www.charmverse.io/solutions'
                            }
                          },
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-22T15:50:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ' ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-22T15:50:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ': Find examples of how to use CharmVerse for your web3 community.',
                        type: 'text'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'listItem',
                attrs: {
                  track: [],
                  todoChecked: null
                },
                content: [
                  {
                    type: 'paragraph',
                    attrs: {
                      track: []
                    },
                    content: [
                      {
                        text: 'FAQ',
                        type: 'text',
                        marks: [
                          {
                            type: 'link',
                            attrs: {
                              href: 'https://www.charmverse.io/faq'
                            }
                          },
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-22T16:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ' ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-22T16:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ': Any questions? Maybe we already answered them here ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-22T16:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          },
                          {
                            type: 'text-color',
                            attrs: {
                              color: null,
                              bgColor: null
                            }
                          }
                        ]
                      },
                      {
                        type: 'emoji',
                        attrs: {
                          emoji: '😉'
                        },
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-22T16:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ' ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-22T16:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
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
            type: 'paragraph',
            attrs: {
              track: []
            }
          }
        ]
      },
      {
        type: 'paragraph',
        attrs: {
          track: []
        }
      },
      {
        type: 'horizontalRule',
        attrs: {
          track: []
        }
      },
      {
        type: 'blockquote',
        attrs: {
          emoji: '🤝',
          track: []
        },
        content: [
          {
            type: 'paragraph',
            attrs: {
              track: []
            },
            content: [
              {
                text: 'Collaborate in CharmVerse',
                type: 'text',
                marks: [
                  {
                    type: 'bold'
                  },
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2022-12-29T20:30:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  },
                  {
                    type: 'text-color',
                    attrs: {
                      color: 'red',
                      bgColor: ''
                    }
                  }
                ]
              }
            ]
          },
          {
            type: 'paragraph',
            attrs: {
              track: []
            },
            content: [
              {
                text: 'CharmVerse is better with friends, teammates, and collaborators ',
                type: 'text',
                marks: [
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2022-12-29T20:40:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  }
                ]
              },
              {
                type: 'emoji',
                attrs: {
                  emoji: '🥳'
                }
              },
              {
                text: ' ',
                type: 'text'
              }
            ]
          }
        ]
      },
      {
        type: 'columnLayout',
        attrs: {
          track: []
        },
        content: [
          {
            type: 'columnBlock',
            content: [
              {
                type: 'disclosureDetails',
                content: [
                  {
                    type: 'disclosureSummary',
                    content: [
                      {
                        type: 'paragraph',
                        attrs: {
                          track: []
                        },
                        content: [
                          {
                            text: 'Add a teammate',
                            type: 'text',
                            marks: [
                              {
                                type: 'insertion',
                                attrs: {
                                  date: '2022-12-29T20:30:00.000Z',
                                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                                  approved: true,
                                  username: 'Drea | CharmVerse'
                                }
                              }
                            ]
                          }
                        ]
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
                          track: [],
                          todoChecked: false
                        },
                        content: [
                          {
                            type: 'paragraph',
                            attrs: {
                              track: []
                            },
                            content: [
                              {
                                text: 'Create a private link',
                                type: 'text',
                                marks: [
                                  {
                                    type: 'insertion',
                                    attrs: {
                                      date: '2022-12-29T20:30:00.000Z',
                                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                                      approved: true,
                                      username: 'Drea | CharmVerse'
                                    }
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      },
                      {
                        type: 'listItem',
                        attrs: {
                          track: [],
                          todoChecked: false
                        },
                        content: [
                          {
                            type: 'paragraph',
                            attrs: {
                              track: []
                            },
                            content: [
                              {
                                text: 'Add a token gate',
                                type: 'text',
                                marks: [
                                  {
                                    type: 'insertion',
                                    attrs: {
                                      date: '2022-12-29T20:30:00.000Z',
                                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                                      approved: true,
                                      username: 'Drea | CharmVerse'
                                    }
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
                    type: 'paragraph',
                    attrs: {
                      track: []
                    }
                  },
                  {
                    type: 'video',
                    attrs: {
                      src: 'https://tiny.charmverse.io/invites',
                      track: [],
                      width: 197,
                      height: 395.48022598870057,
                      muxAssetId: '',
                      muxPlaybackId: ''
                    }
                  }
                ]
              }
            ]
          },
          {
            type: 'columnBlock',
            content: [
              {
                type: 'disclosureDetails',
                content: [
                  {
                    type: 'disclosureSummary',
                    content: [
                      {
                        type: 'paragraph',
                        attrs: {
                          track: []
                        },
                        content: [
                          {
                            text: 'Checkout the Member Directory',
                            type: 'text',
                            marks: [
                              {
                                type: 'insertion',
                                attrs: {
                                  date: '2022-12-29T20:30:00.000Z',
                                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                                  approved: true,
                                  username: 'Drea | CharmVerse'
                                }
                              }
                            ]
                          }
                        ]
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
                          track: [],
                          todoChecked: false
                        },
                        content: [
                          {
                            type: 'paragraph',
                            attrs: {
                              track: []
                            },
                            content: [
                              {
                                text: 'Add a custom property',
                                type: 'text',
                                marks: [
                                  {
                                    type: 'insertion',
                                    attrs: {
                                      date: '2022-12-29T20:30:00.000Z',
                                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                                      approved: true,
                                      username: 'Drea | CharmVerse'
                                    }
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      },
                      {
                        type: 'listItem',
                        attrs: {
                          track: [],
                          todoChecked: false
                        },
                        content: [
                          {
                            type: 'paragraph',
                            attrs: {
                              track: []
                            },
                            content: [
                              {
                                text: 'Complete your workspace profile',
                                type: 'text',
                                marks: [
                                  {
                                    type: 'insertion',
                                    attrs: {
                                      date: '2022-12-29T20:30:00.000Z',
                                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                                      approved: true,
                                      username: 'Drea | CharmVerse'
                                    }
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
                    type: 'paragraph',
                    attrs: {
                      track: []
                    }
                  },
                  {
                    type: 'video',
                    attrs: {
                      src: 'https://tiny.charmverse.io/member-directory',
                      track: [],
                      width: 197,
                      height: 395.48022598870057,
                      muxAssetId: '',
                      muxPlaybackId: ''
                    }
                  }
                ]
              }
            ]
          },
          {
            type: 'columnBlock',
            content: [
              {
                type: 'disclosureDetails',
                content: [
                  {
                    type: 'disclosureSummary',
                    content: [
                      {
                        type: 'paragraph',
                        attrs: {
                          track: []
                        },
                        content: [
                          {
                            text: 'Try creating a proposal',
                            type: 'text',
                            marks: [
                              {
                                type: 'insertion',
                                attrs: {
                                  date: '2022-12-29T20:30:00.000Z',
                                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                                  approved: true,
                                  username: 'Drea | CharmVerse'
                                }
                              }
                            ]
                          }
                        ]
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
                          track: [],
                          todoChecked: false
                        },
                        content: [
                          {
                            type: 'paragraph',
                            attrs: {
                              track: []
                            },
                            content: [
                              {
                                text: 'Build a proposal template',
                                type: 'text',
                                marks: [
                                  {
                                    type: 'insertion',
                                    attrs: {
                                      date: '2022-12-29T20:30:00.000Z',
                                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                                      approved: true,
                                      username: 'Drea | CharmVerse'
                                    }
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      },
                      {
                        type: 'listItem',
                        attrs: {
                          track: [],
                          todoChecked: false
                        },
                        content: [
                          {
                            type: 'paragraph',
                            attrs: {
                              track: []
                            },
                            content: [
                              {
                                text: 'Start your first proposal',
                                type: 'text',
                                marks: [
                                  {
                                    type: 'insertion',
                                    attrs: {
                                      date: '2022-12-29T20:30:00.000Z',
                                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                                      approved: true,
                                      username: 'Drea | CharmVerse'
                                    }
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
                    type: 'paragraph',
                    attrs: {
                      track: []
                    }
                  },
                  {
                    type: 'video',
                    attrs: {
                      src: 'https://tiny.charmverse.io/proposal-builder',
                      track: [],
                      width: 197,
                      height: 395.48022598870057,
                      muxAssetId: '',
                      muxPlaybackId: ''
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        type: 'columnLayout',
        attrs: {
          track: []
        },
        content: [
          {
            type: 'columnBlock'
          }
        ]
      },
      {
        type: 'paragraph',
        attrs: {
          track: []
        }
      },
      {
        type: 'horizontalRule',
        attrs: {
          track: []
        }
      },
      {
        type: 'blockquote',
        attrs: {
          emoji: '🔗',
          track: []
        },
        content: [
          {
            type: 'paragraph',
            attrs: {
              track: []
            },
            content: [
              {
                text: 'Useful',
                type: 'text',
                marks: [
                  {
                    type: 'bold'
                  },
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2022-12-29T21:00:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  },
                  {
                    type: 'text-color',
                    attrs: {
                      color: 'orange',
                      bgColor: ''
                    }
                  }
                ]
              },
              {
                text: ' Links',
                type: 'text',
                marks: [
                  {
                    type: 'bold'
                  },
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2022-12-29T15:00:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  },
                  {
                    type: 'text-color',
                    attrs: {
                      color: 'orange',
                      bgColor: ''
                    }
                  }
                ]
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
                  track: [],
                  todoChecked: null
                },
                content: [
                  {
                    type: 'paragraph',
                    attrs: {
                      track: []
                    },
                    content: [
                      {
                        text: 'How it works',
                        type: 'text',
                        marks: [
                          {
                            type: 'link',
                            attrs: {
                              href: 'https://www.charmverse.io/how-it-works'
                            }
                          },
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: " : Learn about CharmVerse's cool web3 features like",
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ' ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2023-01-27T17:50:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: 'Forum',
                        type: 'text',
                        marks: [
                          {
                            type: 'link',
                            attrs: {
                              href: 'https://www.charmverse.io/forum'
                            }
                          },
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2023-01-27T17:50:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ',',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2023-01-27T17:50:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ' ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: 'Proposal Builder',
                        type: 'text',
                        marks: [
                          {
                            type: 'link',
                            attrs: {
                              href: 'https://www.charmverse.io/proposal-builder'
                            }
                          },
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ', ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: 'Bounties',
                        type: 'text',
                        marks: [
                          {
                            type: 'link',
                            attrs: {
                              href: 'https://tiny.charmverse.io/bounties'
                            }
                          },
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ', ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: 'and ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-30T15:40:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: 'Member Directory',
                        type: 'text',
                        marks: [
                          {
                            type: 'link',
                            attrs: {
                              href: 'https://www.charmverse.io/member-directory'
                            }
                          },
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: '. You will find shortcuts to these features at the top of your sidebar.',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                type: 'listItem',
                attrs: {
                  track: [],
                  todoChecked: null
                },
                content: [
                  {
                    type: 'paragraph',
                    attrs: {
                      track: []
                    },
                    content: [
                      {
                        text: 'Solutions',
                        type: 'text',
                        marks: [
                          {
                            type: 'link',
                            attrs: {
                              href: 'https://www.charmverse.io/solutions'
                            }
                          },
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ' : Find examples of how to use CharmVerse for your web3 community.',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                type: 'listItem',
                attrs: {
                  track: [],
                  todoChecked: null
                },
                content: [
                  {
                    type: 'paragraph',
                    attrs: {
                      track: []
                    },
                    content: [
                      {
                        text: 'FAQ',
                        type: 'text',
                        marks: [
                          {
                            type: 'link',
                            attrs: {
                              href: 'https://www.charmverse.io/faq'
                            }
                          },
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ' ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ': Any questions? Maybe we already answered them here ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          },
                          {
                            type: 'text-color',
                            attrs: {
                              color: null,
                              bgColor: null
                            }
                          }
                        ]
                      },
                      {
                        type: 'emoji',
                        attrs: {
                          emoji: '😉'
                        },
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
                          }
                        ]
                      },
                      {
                        text: ' ',
                        type: 'text',
                        marks: [
                          {
                            type: 'insertion',
                            attrs: {
                              date: '2022-12-29T15:00:00.000Z',
                              user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                              approved: true,
                              username: 'Drea | CharmVerse'
                            }
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
        type: 'columnLayout',
        attrs: {
          track: []
        },
        content: [
          {
            type: 'columnBlock'
          }
        ]
      },
      {
        type: 'paragraph',
        attrs: {
          track: []
        }
      },
      {
        type: 'horizontalRule',
        attrs: {
          track: []
        }
      },
      {
        type: 'blockquote',
        attrs: {
          emoji: '👉',
          track: []
        },
        content: [
          {
            type: 'paragraph',
            attrs: {
              track: []
            },
            content: [
              {
                text: 'Need more information',
                type: 'text',
                marks: [
                  {
                    type: 'bold'
                  },
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2022-12-22T16:00:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  },
                  {
                    type: 'text-color',
                    attrs: {
                      color: 'purple',
                      bgColor: ''
                    }
                  }
                ]
              },
              {
                text: '?',
                type: 'text',
                marks: [
                  {
                    type: 'bold'
                  },
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2022-12-21T15:20:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  },
                  {
                    type: 'text-color',
                    attrs: {
                      color: 'purple',
                      bgColor: ''
                    }
                  }
                ]
              },
              {
                text: ' Click ',
                type: 'text',
                marks: [
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2022-12-21T15:20:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  }
                ]
              },
              {
                text: 'Support & Feedback',
                type: 'text',
                marks: [
                  {
                    type: 'bold'
                  },
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2022-12-21T16:20:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  },
                  {
                    type: 'text-color',
                    attrs: {
                      color: '',
                      bgColor: 'gray'
                    }
                  }
                ]
              },
              {
                text: ' in the left sidebar to join our Discord and chat with us',
                type: 'text',
                marks: [
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2022-12-21T16:20:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  }
                ]
              },
              {
                text: '.',
                type: 'text',
                marks: [
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2022-12-21T15:20:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        type: 'columnLayout',
        attrs: {
          track: []
        },
        content: [
          {
            type: 'columnBlock'
          }
        ]
      },
      {
        type: 'paragraph',
        attrs: {
          track: []
        }
      },
      {
        type: 'paragraph',
        attrs: {
          track: []
        }
      },
      {
        type: 'paragraph',
        attrs: {
          track: []
        }
      }
    ]
  },
  contentText:
    " Welcome to CharmVerse!A web3 community platform. Powering the Future of Work through Web3. The solution for token communities to build relationships, work together and vote.Here are the basics:Click anywhere and just start typingHit / to see all the types of content you can add - headings, videos, tweets, sub pages, etc.Give it a go. Hit / and insert a new sub page here  Hit : to add an emoji. Go ahead and add your favorite emoji here  Highlight any text, and use the menu that pops up to style your writing however you likeHighlight this text and turn it into a Callout with a fire emoji.See the ⋮⋮ to the left of this checkbox on hover? Click and drag to move this line.Hover over SPACE in your sidebar and click the + button to add a new pageThis is a toggle block. Click the little triangle to see more useful tips!How it works : Learn about CharmVerse's cool web3 features like Forum, Proposal Builder, Bounties, and Member Directory. You will find shortcuts to these features at the top of your sidebar.Solutions : Find examples of how to use CharmVerse for your web3 community.FAQ : Any questions? Maybe we already answered them here  Collaborate in CharmVerseCharmVerse is better with friends, teammates, and collaborators  Add a teammateCreate a private linkAdd a token gateCheckout the Member DirectoryAdd a custom propertyComplete your workspace profileTry creating a proposalBuild a proposal templateStart your first proposalUseful LinksHow it works : Learn about CharmVerse's cool web3 features like Forum, Proposal Builder, Bounties, and Member Directory. You will find shortcuts to these features at the top of your sidebar.Solutions : Find examples of how to use CharmVerse for your web3 community.FAQ : Any questions? Maybe we already answered them here  Need more information? Click Support & Feedback in the left sidebar to join our Discord and chat with us."
};
