import { DependencyList, useEffect, useRef } from "react";

/**
 * Run `fn` `waitTime` ms after the last change to `deps` (a debounced effect).
 *
 * The effect is keyed on the spread `deps` — a re-render that doesn't change any dep
 * value does not restart the timer. `fn` is read through a ref, so the timeout always
 * runs the latest closure without needing `fn` to be a stable reference.
 * The current `deps` are passed to `fn` as arguments.
 */
export function useDebounceEffect(
  fn: (...deps: DependencyList) => void,
  waitTime: number,
  deps: DependencyList = [],
) {
  const latest = useRef({ fn, deps });
  latest.current = { fn, deps };

  useEffect(() => {
    const t = setTimeout(() => latest.current.fn(...latest.current.deps), waitTime);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, waitTime]);
}
