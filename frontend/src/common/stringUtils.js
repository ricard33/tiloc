export const template = (tpl, args) => tpl.replace(/\${(\w+)}/g, (_, v) => args[v]);
