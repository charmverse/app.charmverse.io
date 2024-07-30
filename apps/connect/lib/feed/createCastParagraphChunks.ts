import type { Cast } from './getFarcasterUserReactions';

export function createCastParagraphChunks(cast: Cast) {
  const castParagraphsChunks = cast.text.split('\n').map((text) =>
    createCastTextChunks({
      text,
      separators: [
        ...cast.mentioned_profiles.map((profile) => ({
          id: `@${profile.username}`,
          type: 'mention' as const
        })),
        ...cast.embeds
          .filter((embed) => 'url' in embed)
          .map((embed) => ({
            id: embed.url,
            type: 'link' as const
          }))
      ]
    })
  );
  return castParagraphsChunks;
}

function createCastTextChunks({
  text,
  separators
}: {
  text: string;
  separators: {
    type: 'link' | 'mention';
    id: string;
  }[];
}) {
  return separators.reduce<
    {
      text: string;
      type: 'text' | 'mention' | 'link';
    }[]
  >(
    (chunks, separator) => {
      return chunks
        .map((chunk) =>
          chunk.text
            .split(separator.id)
            .map((chunkText, index, _chunks) => {
              if (_chunks.length - 1 === index) {
                return [
                  {
                    text: chunkText,
                    type: chunk.type
                  }
                ];
              }
              return [
                {
                  text: chunkText,
                  type: chunk.type
                },
                {
                  text: separator.id,
                  type: separator.type
                }
              ];
            })
            .flat()
        )
        .flat();
    },
    [
      {
        text,
        type: 'text' as const
      }
    ]
  );
}
