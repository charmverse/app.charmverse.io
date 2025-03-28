import { stringToValidPath } from '../strings';

describe('stringToValidPath', () => {
  it('should return a path as a lowercase, replacing consecutive whitespaces with a single underscore and appending random id', () => {
    const postTitle = 'Post   Title';
    const path = stringToValidPath({ input: postTitle });
    expect(path).toMatch(/^post_title/);
  });

  it('should not exceed 60 characters', () => {
    // This number is also defined in stringToValidPath lib, but defined independently here as a failsafe
    const maxchars = 60;

    let title = '';

    for (let i = 0; i < 100; i++) {
      title += 'a';
    }

    const path = stringToValidPath({ input: title, maxLength: maxchars });
    expect(path.length).toBe(maxchars);
  });

  it('should replace & by whitespace', () => {
    const title = 'Questions & Support';
    const path = stringToValidPath({ input: title });
    expect(path).toBe('questions_support');
  });

  it('should drop any consecutive non alphanumeric / space characters', () => {
    const titleWithInvalidChars = '$%Post Title!@#abc$%^*()_+{}:"<>?[];\',./';
    const path = stringToValidPath({ input: titleWithInvalidChars });
    expect(path).toBe('post_title_abc');
  });

  it('should support Japanese characters', () => {
    // text copied from https://generator.lorem-ipsum.info/_japanese
    const japaneseString = `約ばのず井94害ぴ済影ろも外仲込おえけ明犯トイセヱ設知あぜ治禁オ燈気ごおとめ参犯ユ問74材名ナウ以文イめ異族け覚月多いれへル。転ろくら夢感持レニハオ減笠樹ラ道2篠ぶリ民正ー供吹ニチリ里51九かずや険察玉しはさば湖業チク殺南塩抵揚へるづよ。稿ヨハカセ低経歩5豊ク読交トリ指桂タスシソ後生トヲ血俳三し前酒メムロス旅連くる県川べまばぞ互中サ文神亮凱孫へ。

    読レホ小雄てンり雪立ぎみ覧画カル政視ヤマイロ投津サニソ宣惑ご際消ねを輝企ろ政象ぐフず遂92小あぼと空末且佃佞べだぞ。肉オサ特7予らり万載車労カロ図構ちぴか文面決ス踏天審せるお返毎りドぱ武供そおむ生金チクヨ率15図初打セソワ社責ルぴひば。生をゆでづ時事描むね月建井リさ潟中ルあ急厚チ平話シコヤ紙結セタエモ玉19義キマウシ然録ヒオヤチ陸変だ品器カオタワ作声実オヒネナ束8低け`;

    const path = stringToValidPath({ input: japaneseString });

    expect(path.match('井94害ぴ済影ろも外仲込おえ')).not.toBeNull();
  });

  it('should return a uid if the language is currently unsupported', () => {
    // text copied from https://generator.lorem-ipsum.info/_japanese
    const arabicString = `هناك حقيقة مثبتة منذ زمن طويل وهي أن المحتوى المقروء لصفحة ما سيلهي القارئ عن التركيز على الشكل الخارجي للنص أو شكل توضع الفقرات في الصفحة التي يقرأها. ولذلك يتم استخدام`;

    const path = stringToValidPath({ input: arabicString });

    // The uid is 8 characters long. The parser will replace some consecutive characters with an underscore _
    expect(path.match(/[a-zA-Z0-9]{8}/)).not.toBeNull();
    expect(path.length >= 8 && path.length <= 10).toBe(true);
  });
});
