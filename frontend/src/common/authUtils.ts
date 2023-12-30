import { fetchErrorDecode } from "./apiUtils";
import logger from "./logger";
import { auth } from "../actions";
import { useLogoutMutation } from "../services/api";
import { useAlert } from "./alertUtils";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const [doLogout] = useLogoutMutation();
  const { showError } = useAlert();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logout = () => {

    doLogout().then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        showError(t("Logout error: ") + fetchErrorDecode(error));
        console.error(result);
        logger.error(result);
      } else {
        dispatch(auth.logoutSuccessful());
        console.log("Logged out!");
        navigate("/logged-out");
      }
    });
  };

  return {
    logout,
  }
};

