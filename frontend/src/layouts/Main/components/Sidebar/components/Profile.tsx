import React from "react";
import { Link as RouterLink } from "react-router-dom";
import PropTypes from "prop-types";
import { makeStyles } from "@mui/styles";
import { Avatar, Theme, Typography } from "@mui/material";
import { getGravatarUrl } from "../../../../../components/Gravatar";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../store";
import { User } from "../../../../../types";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "fit-content"
  },
  avatar: {
    width: 60,
    height: 60
  },
  name: {
    marginTop: theme.spacing(1)
  }
}));

const Profile = () => {
  const classes = useStyles();
  const user = useSelector<RootState>(store => store.auth.user) as User;

  const avatar = getGravatarUrl(user.email, {
    default: "mp"
  });

  return (
    <div className={classes.root}>
      <Avatar
        alt="Person"
        className={classes.avatar}
        component={RouterLink}
        src={avatar}
        to="/settings"
      />
      <Typography
        className={classes.name}
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
