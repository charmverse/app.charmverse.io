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
            text: 'A community ',
            type: 'text',
            marks: [
              {
                type: 'italic'
              },
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
            text: 'operations ',
            type: 'text',
            marks: [
              {
                type: 'italic'
              },
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
            text: 'platform',
            type: 'text',
            marks: [
              {
                type: 'italic'
              },
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
            text: ' designed specifically for w',
            type: 'text',
            marks: [
              {
                type: 'italic'
              },
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
            text: 'eb3',
            type: 'text',
            marks: [
              {
                type: 'italic'
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
            text: ' communities -',
            type: 'text',
            marks: [
              {
                type: 'italic'
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
                  color: null,
                  bgColor: null
                }
              }
            ]
          },
          {
            text: ' build relationships, work together and vote.',
            type: 'text',
            marks: [
              {
                type: 'italic'
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
                    text: 'Proposals',
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
                type: 'iframe',
                attrs: {
                  src: 'https://tiny.charmverse.io/forum',
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
          url: 'https://app.charmverse.io/charmverse-community/page-649263016636265',
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
        type: 'bookmark',
        attrs: {
          url: 'https://embeds.beehiiv.com/c66f66bc-09b6-4e40-b69a-243f5ce75c3c',
          track: []
        }
      },
      {
        type: 'iframe',
        attrs: {
          src: 'https://embeds.beehiiv.com/c66f66bc-09b6-4e40-b69a-243f5ce75c3c',
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
  contentText:
    '👋 Welcome to CharmVerse!A community operations platform designed specifically for web3 communities - build relationships, work together and vote.Supercharge your community with CharmVerseMember DirectoryCharmVerse automatically builds a directory as members join your space.ProposalsAll-in-one governance solution for web3 grant programs, token communities, and DAOsForumCentral source for conversations that matter.RewardsIncentivize community contribution and collaboration.Collaborate in CharmVerseCharmVerse is better with friends, teammates, and collaborators 🥳  ',
  hasContent: true,
  headerImage:
    'https://s3.amazonaws.com/charm.public/user-content/e5dba747-be62-49be-a7ba-71cf27b17174/2964a494-0aaf-4547-aaff-7b1ebfb540ae/home_banner.jpg',
  icon: '🧑‍🚀',
  type: 'page',
  index: 8,
  version: 660
};
