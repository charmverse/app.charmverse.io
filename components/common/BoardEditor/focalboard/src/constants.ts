
class Constants {
  static readonly menuColors: { [key: string]: string } = {
    propColorDefault: 'Default',
    propColorGray: 'Gray',
    propColorTurquoise: 'Turquoise',
    propColorOrange: 'Orange',
    propColorYellow: 'Yellow',
    propColorTeal: 'Teal',
    propColorBlue: 'Blue',
    propColorPurple: 'Purple',
    propColorRed: 'Red',
    propColorPink: 'Pink'
  };

  static readonly minColumnWidth = 100;

  static readonly defaultTitleColumnWidth = 280;

  static readonly titleColumnId = '__title';

  static readonly badgesColumnId = '__badges';

  static readonly versionString = '0.14.0';

  static readonly versionDisplayString = 'Feb 2022';

  static readonly languages = [
    {
      code: 'en',
      name: 'english',
      displayName: 'English'
    },
    {
      code: 'es',
      name: 'spanish',
      displayName: 'Español (Alpha)'
    },
    {
      code: 'de',
      name: 'german',
      displayName: 'Deutsch'
    },
    {
      code: 'ja',
      name: 'japanese',
      displayName: '日本語'
    },
    {
      code: 'fr',
      name: 'french',
      displayName: 'Français (Beta)'
    },
    {
      code: 'nl',
      name: 'dutch',
      displayName: 'Nederlands'
    },
    {
      code: 'ru',
      name: 'russian',
      displayName: 'Pусский (Beta)'
    },
    {
      code: 'zh-cn',
      name: 'chinese',
      displayName: '中文 (繁體)'
    },
    {
      code: 'zh-tw',
      name: 'simplified-chinese',
      displayName: '中文 (简体)'
    },
    {
      code: 'tr',
      name: 'turkish',
      displayName: 'Türkçe'
    },
    {
      code: 'oc',
      name: 'occitan',
      displayName: 'Occitan'
    },
    {
      code: 'pt_BR',
      name: 'portuguese',
      displayName: 'Português (Brasil) (Beta)'
    },
    {
      code: 'ca',
      name: 'catalan',
      displayName: 'Català (Beta)'
    },
    {
      code: 'el',
      name: 'greek',
      displayName: 'Ελληνικά (Alpha)'
    },
    {
      code: 'id',
      name: 'indonesian',
      displayName: 'bahasa Indonesia (Alpha)'
    },
    {
      code: 'it',
      name: 'italian',
      displayName: 'Italiano (Beta)'
    },
    {
      code: 'sv',
      name: 'swedish',
      displayName: 'Svenska (Beta)'
    }
  ];
}

export { Constants };
