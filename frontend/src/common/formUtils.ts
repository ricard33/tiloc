import { useContext, useEffect } from "react";
import { UNSAFE_NavigationContext as NavigationContext } from "react-router-dom";
import { useUnsavedChangesConfirm } from "./dialogs";


export const usePageUnloadAlert = (isDirty: boolean) => {
  const { navigator } = useContext(NavigationContext);
  const confirmExit = useUnsavedChangesConfirm();

  useEffect(() => {
    const unloadCallback = (event: { preventDefault: () => void; returnValue: string; }) => {
      console.log("unloadCallback", isDirty);
      if (isDirty) {
        event.preventDefault();
        event.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", unloadCallback);
    return () => window.removeEventListener("beforeunload", unloadCallback);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const push = navigator.push;

    navigator.push = (...args: Parameters<typeof push>) => {
      confirmExit()
        .then(() => {
          push(...args);
        });
    };

    return () => {
      navigator.push = push;
    };
  }, [navigator, confirmExit, isDirty]);

};

