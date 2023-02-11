import { Map } from 'immutable';

export default function getBlockData(
  node: HTMLElement
): Object|undefined {
  if (node.style.textAlign) {
    return ({
      'text-align': node.style.textAlign,
    })
  } else if (node.style.marginLeft) {
    return Map({
      'margin-left': node.style.marginLeft,
    })
  }
  return undefined;
}
