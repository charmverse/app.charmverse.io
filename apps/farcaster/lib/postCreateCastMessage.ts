export function postCreateCastMessage({ embeds, text }: { text: string; embeds: string[] }) {
  window.parent.postMessage(
    {
      type: 'createCast',
      data: {
        cast: {
          text,
          embeds
        }
      }
    },
    '*'
  );
}
