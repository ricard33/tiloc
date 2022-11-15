export const template = (tpl: string, args: { [x: string]: any; name?: string; age?: number; } | undefined) =>
  tpl.replace(/\${(\w+)}/g, (_, v) => args![v]);
