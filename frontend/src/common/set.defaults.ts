// set.defaults.ts

type OptionalPropertyOf<T> = Exclude<{
  [K in keyof T]: T extends Record<K, T[K]>
    ? never
    : K
}[keyof T], undefined>

export default function setDefaults<Props>(props: Props, defaults: Pick<Props, OptionalPropertyOf<Props>>): Required<Props> {
  const newProps: Required<Props> = { ...props } as Required<Props>;
  const defaultKeys = Object.keys(defaults) as string[];
  defaultKeys.forEach((key) => {
    const propKey = key as keyof Props;
    const defaultKey = key as keyof Pick<Props, OptionalPropertyOf<Props>>;
    Object.defineProperty(newProps, key, {
      value: props[propKey] !== undefined ? props[propKey] : defaults[defaultKey],
      enumerable: true
    });
  });
  return newProps;
}
