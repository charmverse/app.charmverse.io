import type { Page } from '@charmverse/core/prisma';

export type GettingStartedPage = Pick<
  Page,
  'title' | 'icon' | 'headerImage' | 'hasContent' | 'content' | 'contentText' | 'type' | 'index' | 'version'
>;

export const gettingStartedPage: GettingStartedPage = {
  title: 'Getting Started',
  content: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: {
          id: null,
          level: 1,
          track: []
        },
        content: [
          {
            type: 'emoji',
            attrs: {
              emoji: '👋'
            },
            marks: [
              {
                type: 'insertion',
                attrs: {
                  date: '2023-12-03T19:50:00.000Z',
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
          },
          {
            text: ' Welcome to CharmVerse!',
            type: 'text',
            marks: [
              {
                type: 'insertion',
                attrs: {
                  date: '2023-12-03T19:50:00.000Z',
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
            text: 'The network for onchain communities. Manage grants, connect with builders, and forge new ideas.',
            type: 'text',
            marks: [
              {
                type: 'italic'
              },
              {
                type: 'insertion',
                attrs: {
                  date: '2024-04-30T15:20:00.000Z',
                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                  approved: true,
                  username: 'Drea | CharmVerse'
                }
              }
            ]
          }
        ]
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
            type: 'heading',
            attrs: {
              id: null,
              level: 2,
              track: []
            },
            content: [
              {
                text: 'Supercharge your community with',
                type: 'text',
                marks: [
                  {
                    type: 'bold'
                  },
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2023-12-03T20:20:00.000Z',
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
              },
              {
                text: ' CharmVerse',
                type: 'text',
                marks: [
                  {
                    type: 'bold'
                  },
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2023-12-03T19:50:00.000Z',
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
            attrs: {
              size: 319,
              track: []
            },
            content: [
              {
                type: 'heading',
                attrs: {
                  id: null,
                  level: 2,
                  track: []
                },
                content: [
                  {
                    text: 'Member Directory',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2023-12-03T19:50:00.000Z',
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
                    text: 'CharmVerse automatically builds a directory as members join your space.',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2023-12-03T19:50:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
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
                type: 'linkedPage',
                attrs: {
                  id: 'members',
                  path: 'members',
                  type: 'members',
                  track: []
                }
              },
              {
                type: 'iframe',
                attrs: {
                  src: 'https://tiny.charmverse.io/member-directory',
                  type: 'embed',
                  track: [],
                  width: 700,
                  height: 200
                }
              }
            ]
          },
          {
            type: 'columnBlock',
            attrs: {
              size: 331,
              track: []
            },
            content: [
              {
                type: 'heading',
                attrs: {
                  id: null,
                  level: 2,
                  track: []
                },
                content: [
                  {
                    text: 'Decisions Framework',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2024-04-30T15:20:00.000Z',
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
                    text: 'A',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2023-12-03T20:20:00.000Z',
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
                    text: 'll-in-one governance solution for web3',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2023-12-03T19:50:00.000Z',
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
                    text: ' ',
                    type: 'text',
                    marks: [
                      {
                        type: 'bold'
                      },
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2023-12-03T19:50:00.000Z',
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
                    text: 'grant programs, token communities, and DAOs',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2023-12-03T19:50:00.000Z',
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
                type: 'linkedPage',
                attrs: {
                  id: 'proposals',
                  path: 'proposals',
                  type: 'proposals',
                  track: []
                }
              },
              {
                type: 'iframe',
                attrs: {
                  src: 'https://tiny.charmverse.io/proposal-builder',
                  type: 'embed',
                  track: [],
                  width: 700,
                  height: 200
                }
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
            attrs: {
              track: []
            },
            content: [
              {
                type: 'heading',
                attrs: {
                  id: null,
                  level: 2,
                  track: []
                },
                content: [
                  {
                    text: 'Forum',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2023-12-03T20:00:00.000Z',
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
                    text: 'C',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2023-12-03T20:20:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  },
                  {
                    text: 'entral source for conversations that matter.',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2023-12-03T20:00:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
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
                type: 'linkedPage',
                attrs: {
                  id: 'forum',
                  path: 'forum',
                  type: 'forum',
                  track: []
                }
              },
              {
                type: 'iframe',
                attrs: {
                  src: 'https://tiny.charmverse.io/forum',
                  type: 'embed',
                  track: [],
                  width: 700,
                  height: 200
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
          {
            type: 'columnBlock',
            attrs: {
              track: []
            },
            content: [
              {
                type: 'heading',
                attrs: {
                  id: null,
                  level: 2,
                  track: []
                },
                content: [
                  {
                    text: 'Rewards',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2023-12-03T20:00:00.000Z',
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
                    text: 'Incentivize community contribution and collaboration.',
                    type: 'text',
                    marks: [
                      {
                        type: 'insertion',
                        attrs: {
                          date: '2023-12-03T20:00:00.000Z',
                          user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                          approved: true,
                          username: 'Drea | CharmVerse'
                        }
                      }
                    ]
                  }
                ]
              },
              {
                type: 'linkedPage',
                attrs: {
                  id: 'rewards',
                  path: 'rewards',
                  type: 'rewards',
                  track: []
                }
              },
              {
                type: 'iframe',
                attrs: {
                  src: 'https://tiny.charmverse.io/rewards',
                  type: 'embed',
                  track: [],
                  width: 700,
                  height: 200
                }
              }
            ]
          }
        ]
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
            type: 'heading',
            attrs: {
              id: null,
              level: 2,
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
                      date: '2023-12-03T19:50:00.000Z',
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
                text: 'CharmVerse is better with friends, teammates, and collaborators ',
                type: 'text',
                marks: [
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2023-12-03T19:50:00.000Z',
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
                },
                marks: [
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2023-12-03T19:50:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  }
                ]
              },
              {
                text: '  ',
                type: 'text',
                marks: [
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2023-12-03T19:50:00.000Z',
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
        type: 'iframe',
        attrs: {
          src: 'https://tiny.charmverse.io/invites',
          type: 'embed',
          track: [],
          width: 700,
          height: 395.4802259887006
        }
      },
      {
        type: 'columnLayout',
        attrs: {
          track: []
        },
        content: [
          {
            type: 'columnBlock',
            attrs: {
              track: []
            }
          }
        ]
      },
      {
        type: 'horizontalRule',
        attrs: {
          track: []
        }
      },
      {
        type: 'bookmark',
        attrs: {
          url: 'https://tiny.charmverse.io/user-manual',
          track: []
        }
      },
      {
        type: 'bookmark',
        attrs: {
          url: 'https://discord.gg/ACYCzBGC2M',
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
    '👋 Welcome to CharmVerse!The network for onchain communities. Manage grants, connect with builders, and forge new ideas.Supercharge your community with CharmVerseMember DirectoryCharmVerse automatically builds a directory as members join your space.Decisions FrameworkAll-in-one governance solution for web3 grant programs, token communities, and DAOsForumCentral source for conversations that matter.RewardsIncentivize community contribution and collaboration.Collaborate in CharmVerseCharmVerse is better with friends, teammates, and collaborators 🥳  ',
  hasContent: true,
  headerImage:
    'https://cdn.charmverse.io/user-content/e5dba747-be62-49be-a7ba-71cf27b17174/84420894-282c-4edb-99d0-8da3dab391b3/new-cv-town-banner.png',
  icon: 'https://cdn.charmverse.io/user-content/e5dba747-be62-49be-a7ba-71cf27b17174/c247d71d-1b27-4bc1-86b8-b5f151d926f7/white-c-black-circle-(1).png',
  type: 'page',
  index: 8,
  version: 660
};
