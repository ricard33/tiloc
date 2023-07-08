import { useState, useEffect } from 'react';

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

function debounce(fn: Function, ms: number) {
  let timeoutId: number;
  return () => {
    clearTimeout(timeoutId);
    // @ts-ignore
    timeoutId = window.setTimeout(() => fn.apply(this, arguments), ms);
  };
}

export default function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    const updateSize = () => {
      setWindowDimensions(getWindowDimensions());
    };
    const debouncedUpdateSize = debounce(updateSize, 100);

    window.addEventListener('resize', debouncedUpdateSize);
    return () => window.removeEventListener('resize', debouncedUpdateSize);
  }, []);

  return windowDimensions;
}
