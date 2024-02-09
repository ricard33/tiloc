import React from "react";
import { Link as RouterLink } from "react-router-dom";
import PropTypes from "prop-types";
import { Avatar, Typography } from "@mui/material";
import { getGravatarUrl } from "../../../../../components/Gravatar";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../store";
import { User } from "../../../../../types";

const Profile = () => {
  const user = useSelector<RootState>(store => store.auth.user) as User;

  const avatar = getGravatarUrl(user.email, {
    default: "mp"
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "fit-content" }}>
      <Avatar
        alt="Person"
        sx={{ width: "60px", height: "60px" }}
        component={RouterLink}
        src={avatar}
        to="/settings"
      />
      <Typography
        sx={{ marginTop: 1 }}
        variant="h5"
      >
        {user.full_name}
      </Typography>
      <Typography variant="body2">"Small bio</Typography>
    </div>
  );
};

Profile.propTypes = {
  className: PropTypes.string
};

export default Profile;
