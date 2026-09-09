 
import React from "react";

const isRegExp = function (re: RegExp | string) {
  return re instanceof RegExp;
};

const escapeRegExp = function escapeRegExp(string: string) {
  const reRegExpChar = /[\\^$.*+?()[\]{}|]/g,
    reHasRegExpChar = RegExp(reRegExpChar.source);

  return string && reHasRegExpChar.test(string) ? string.replace(reRegExpChar, "\\$&") : string;
};

const isString = function (value: React.ReactNode | string) {
  return typeof value === "string";
};

const flatten = function (array: any[]) {
  let newArray: any[] = [];

  array.forEach(function (item) {
    if (Array.isArray(item)) {
      newArray = newArray.concat(item);
    } else {
      newArray.push(item);
    }
  });

  return newArray;
};

/**
 * Given a string, replace every substring that is matched by the `match` regex
 * with the result of calling `fn` on matched substring. The result will be an
 * array with all odd indexed elements containing the replacements. The primary
 * use case is similar to using String.prototype.replace except for React.
 *
 * React will happily render an array as children of a React element, which
 * makes this approach very useful for tasks like surrounding certain text
 * within a string with react elements.
 *
 * Example:
 * matchReplace(
 *   'Emphasize all phone numbers like 884-555-4443.',
 *   /([\d|-]+)/g,
 *   (number, i) => <strong key={i}>{number}</strong>
 * );
 * // => ['Emphasize all phone numbers like ', <strong>884-555-4443</strong>, '.']
 *
 * @param {string} str
 * @param {RegExp|str} match Must contain a matching group
 * @param {function} fn
 * @return {array}
 */
function replaceString(
  str: string,
  match: RegExp | string,
  fn: (match: string, index: number, offset: number) => React.ReactNode
): React.ReactNode[] {
  let curCharStart = 0;
  let curCharLen = 0;

  if (str === "") {
    return [str];
  } else if (!str || !isString(str)) {
    throw new TypeError("First argument to react-string-replace#replaceString must be a string");
  }

  const re = isRegExp(match) ? (match as RegExp) : new RegExp("(" + escapeRegExp(match as string) + ")", "gi");

  const result: (React.ReactNode|string)[] = str.split(re);

  // Apply fn to all odd elements
  for (let i = 1, length = result.length; i < length; i += 2) {
    /** @see {@link https://github.com/iansinnott/react-string-replace/issues/74} */
    if (result[i] === undefined || result[i - 1] === undefined) {
      console.warn(
        "reactStringReplace: Encountered undefined value during string replacement. Your RegExp may not be working the way you expect."
      );
      continue;
    }

    curCharLen = (result[i] as string).length;
    curCharStart += (result[i - 1] as string).length;
    result[i] = fn(result[i] as string, i, curCharStart);
    curCharStart += curCharLen;
  }

  return result;
}

export default function reactStringReplace(
  source: string | React.ReactNode[] | any[],
  match: RegExp | string,
  fn: (match: string, index: number, offset: number) => React.ReactNode
): React.ReactNode[] {
  const sourceArray:(React.ReactNode|string)[] = Array.isArray(source) ?  source : [source];

  return flatten(
    sourceArray.map(function (x) {
      return isString(x) ? replaceString(x as string, match, fn) : x;
    })
  );
};
