import React, { useCallback } from "react";
import { useEffect, Fragment } from "react";
import { User } from "../types";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { useTranslation } from "react-i18next";

export interface ChatwootProps {
  token: string;
  // currentUser?: User;
}

declare global {
  interface Window {
    chatwootSDK: any;
    chatwootSettings: any;
  }
}

function ChatwootScript(props: ChatwootProps) {
  const { token} = props;
  const { t } = useTranslation();
  const currentUser = useSelector<RootState>(store => store.auth.user) as User;
  const BASE_URL = "https://support.tiloc.fr";
  const SCRIPT_URL = BASE_URL + "/packs/js/sdk.js";
  //const status = useScript(SCRIPT_URL)

  //console.log("status", status)

  const onLoadHandler = useCallback((e: Event) => {
    (e.target as HTMLScriptElement).setAttribute("data-status", "ready");
    if (!token) {
      console.error("Chatwoot SDK requires token.");
    }
    if (!window.chatwootSDK) {
      console.error("Chatwoot SDK didn't load from the source and will not be initialized.");
    }
    window.chatwootSDK.run({
      websiteToken: token,
      baseUrl: BASE_URL
    });
  }, [token]);

  function onErrorHandler(e: Event) {
    (e.target as HTMLScriptElement).setAttribute("data-status", "error");
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkExistingScript = useCallback((): HTMLScriptElement | null => document.querySelector(`script[src="${SCRIPT_URL}"]`), []);

  useEffect(() => {
    if (typeof token !== "string") {
      console.error("Chatwoot SDK requires token.");
    }
    // Check if it is attached to DOM before
    let existingScriptEl: HTMLScriptElement | null = checkExistingScript();

    if (!existingScriptEl) {
      // Add Chatwoot Settings
      window.chatwootSettings = {
        hideMessageBubble: false,
        position: "right", // This can be left or right
        locale: "fr", // Language to be set
        type: "expanded_bubble", // [standard, expanded_bubble]
        launcherTitle: t("Need help?"),

      };

      let scriptEl: HTMLScriptElement = document.createElement("script");
      scriptEl.id = "chatwoot-script";
      scriptEl.src = SCRIPT_URL;
      scriptEl.async = true;
      scriptEl.defer = true;
      scriptEl.addEventListener("load", onLoadHandler);
      scriptEl.addEventListener("error", onErrorHandler);
      document.body.appendChild(scriptEl);
      return () => scriptEl.removeEventListener("load", onLoadHandler);
    }

  }, [SCRIPT_URL, checkExistingScript, onLoadHandler, t, token]);

  useEffect(() => {
    // console.log("Chatwoot: changing user", currentUser)
    // @ts-ignore
    if (window.$chatwoot) {

      if (currentUser) {
        // console.log(`window.$chatwoot.setUser(${currentUser.email})`);
        // @ts-ignore
        window.$chatwoot.setUser(currentUser.id.toString(), {
          name: currentUser.first_name, // Name of the user
          // avatar_url: "", // Avatar URL
          email: currentUser.email, // Email of the user
          identifier_hash: currentUser.chatwoot_identifier_hash, // Identifier Hash generated based on the webwidget hmac_token
          phone_number: currentUser.phone // Phone Number of the user
          // description: "", // description about the user
          // country_code: "", // Two letters country code
          // city: "", // City of the user
          // company_name: "", // company name
          // social_profiles: {
          //   twitter: "", // Twitter user name
          //   linkedin: "", // LinkedIn user name
          //   facebook: "", // Facebook user name
          //   github: "" // Github user name
          // }
        });
      } else {
        // console.log(`window.$chatwoot.reset()`);
        // @ts-ignore
        window.$chatwoot.reset();
      }
    }
  }, [currentUser]);

  return (
    <Fragment />
  );
}

export default ChatwootScript;
