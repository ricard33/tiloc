import { useEffect } from "react";

export const usePageUnloadAlert = (isDirty: () => boolean) => {
  useEffect(() => {
    const unloadCallback = (event: { preventDefault: () => void; returnValue: string; }) => {
      if (isDirty()) {
        event.preventDefault();
        event.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", unloadCallback);
    return () => window.removeEventListener("beforeunload", unloadCallback);
  }, [isDirty]);

};

