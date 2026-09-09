import replaceString from "./reactStringReplace";

describe("reactStringReplace", () => {
  it("Doesn't throw if not given invalid input", () => {
    // @ts-ignore
    expect(() => replaceString()).not.toThrowError();
    // @ts-ignore
    expect(() => replaceString("")).not.toThrowError();
  });

  it("Returns an array", () => {
    expect(Array.isArray(replaceString("blah", "blah", (x) => x))).toBe(true);
  });

  test("Returns correct character offsets", () => {
    const correctOffsets = [6, 17];
    const charOffsets: number[] = [];

    replaceString("Hey there, stranger", "er", (m, i, o) => charOffsets.push(o));
    expect(charOffsets).toEqual(correctOffsets);
  });

  it("Works with matching groups", () => {
    // @ts-ignore
    expect(replaceString("hey there", /(hey)/g, (x) => ({ worked: x }))).toEqual(["", { worked: "hey" }, " there"]);
  });

  it("Respects global flag to replace multiple matches", () => {
    const str = "Hey @ian_sinn and @other_handle, check out this link https://github.com/iansinnott/";
    // @ts-ignore
    expect(replaceString(str, /@(\w+)/g, (x) => ({ worked: x }))).toEqual([
      "Hey ",
      { worked: "ian_sinn" },
      " and ",
      { worked: "other_handle" },
      ", check out this link https://github.com/iansinnott/"
    ]);
  });

  it("Works with strings", () => {
    // @ts-ignore
    expect(replaceString("hey there", "hey", (x) => ({ worked: x })))
      .toEqual(["", { worked: "hey" }, " there"]);
  });

  it("Works with arrays", () => {
    const input = ["hey there", { value: "you" }, "again"];
    // @ts-ignore
    expect(replaceString(input, "hey", (x) => ({ worked: x })))
      .toEqual(["", { worked: "hey" }, " there", { value: "you" }, "again"]);
  });

  it("Successfully escapes parens in strings", () => {
    // @ts-ignore
    expect(replaceString("(hey) there", "(hey)", (x) => ({ worked: x })))
      .toEqual(["", { worked: "(hey)" }, " there"]);

    // @ts-ignore
    expect(replaceString("hey ((y)(you)) there", "((y)(you))", (x) => ({ worked: x })))
      .toEqual(["hey ", { worked: "((y)(you))" }, " there"]);
  });

  it("Can be called consecutively on returned result of previous call", () => {
    const originalTweet =
      "Hey @iansinnott, check out this link https://github.com/iansinnott/ Hope to see you at #reactconf";
    let reactReplacedTweet;

    // Match URLs
    // @ts-ignore
    reactReplacedTweet = replaceString(originalTweet, /(https?:\/\/\S+)/g, (match) => ({ type: "url", value: match }));

    expect(reactReplacedTweet).toEqual([
      "Hey @iansinnott, check out this link ",
      { type: "url", value: "https://github.com/iansinnott/" },
      " Hope to see you at #reactconf"
    ]);

    // Match @-mentions
    // @ts-ignore
    reactReplacedTweet = replaceString(reactReplacedTweet, /(@\w+)/g, (match) => ({ type: "mention", value: match }));

    expect(reactReplacedTweet).toEqual([
      "Hey ",
      { type: "mention", value: "@iansinnott" },
      ", check out this link ",
      { type: "url", value: "https://github.com/iansinnott/" },
      " Hope to see you at #reactconf"
    ]);

    // Match hashtags
    // @ts-ignore
    reactReplacedTweet = replaceString(reactReplacedTweet, /(#\w+)/g, (match) => ({ type: "hashtag", value: match }));

    expect(reactReplacedTweet).toEqual([
      "Hey ",
      { type: "mention", value: "@iansinnott" },
      ", check out this link ",
      { type: "url", value: "https://github.com/iansinnott/" },
      " Hope to see you at ",
      { type: "hashtag", value: "#reactconf" },
      ""
    ]);
  });

  /**
   * This was to address #4, where having a match at the end of a string was
   * causing the first replacement to return an array where the last element was
   * ''. This was causing an error where I was checking for !str, even though an
   * empty string should actually be allwed.
   */
  it("Allows empty strings within results", () => {
    let replacedContent;
    const string = "@username http://a_photo.jpg";

    // @ts-ignore
    replacedContent = replaceString(string, /(http?:\/\/.*\.(?:png|jpg))/g, (match) => {
      return { key: "image", match };
    });

    expect(replacedContent).toEqual(["@username ", { key: "image", match: "http://a_photo.jpg" }, ""]);

    // @ts-ignore
    replacedContent = replaceString(replacedContent, /@(\w+)/g, (match) => {
      return { key: "text", match };
    });

    expect(replacedContent).toEqual([
      "",
      { key: "text", match: "username" },
      " ",
      { key: "image", match: "http://a_photo.jpg" },
      ""
    ]);
  });

  it("Will not through if first element of input is empty string", () => {
    const string = "http://a_photo.jpg some string";
    // @ts-ignore
    const replacedContent = replaceString(string, /(http?:\/\/.*\.(?:png|jpg))/g, (match) => {
      return { key: "image", match };
    });

    expect(replacedContent).toEqual(["", { key: "image", match: "http://a_photo.jpg" }, " some string"]);

    // This replacement would not actually give a new result from above, but it is
    // simply to test that passing in an empty string as the first arg is OK
    expect(() => {
      // @ts-ignore
      replaceString(replacedContent, /@(\w+)/g, (match) => {
        return { key: "text", match };
      });
    }).not.toThrowError();
  });

  it("Avoids undefined values due to regex", () => {
    const string = "hey you there";
    const re = /(hey)|(you)/;

    // Normal splits include undefined if you do this
    expect(string.split(re)).toEqual(["", "hey", undefined, " ", undefined, "you", " there"]);

    expect(() => {
      replaceString(string, /(hey)|(you)/, (x) => x);
    }).not.toThrowError();
  });

  it("Works with phone number regex", () => {
    expect(
      replaceString("+596 696 12 34 56", /([+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[0-9][-\s./0-9]{6,12}[0-9])/g,
        // @ts-ignore
        (x) => ({ worked: x }))).toEqual(
      ["", { worked: "+596 696 12 34 56" }, ""]
    );
  });
});
