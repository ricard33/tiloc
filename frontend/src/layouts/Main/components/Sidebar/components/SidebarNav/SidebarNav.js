/* eslint-disable react/no-multi-comp */
/* eslint-disable react/display-name */
import React from "react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import PropTypes from "prop-types";
import { makeStyles } from "@mui/styles";
import { List, ListItem, colors } from "@mui/material";

const useStyles = makeStyles(theme => ({
  root: {},
  item: {
    display: "flex",
    paddingTop: 0,
    paddingBottom: 0
  },
  button: {
    color: colors.blueGrey[800],
    padding: "10px 8px",
    justifyContent: "flex-start",
    // textTransform: 'none',
    letterSpacing: 0,
    width: "100%",
    fontWeight: theme.typography.fontWeightMedium,

    display: 'inline-flex',
    position: 'relative',
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    outline: '0px',
    border: '0px',
    margin: '0px',
    cursor: 'pointer',
    verticalAlign: 'middle',
    appearance: 'none',
    textDecoration: 'none',
    fontSize: '0.8125rem',
    lineHeight: 1.75,
    textTransform: 'uppercase',
    minWidth: '64px',
    "&:hover": {
      backgroundColor: theme.palette.hover,
    }
  },
  icon: {
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    marginRight: theme.spacing(1)
  },
  active: {
    color: theme.palette.primary.main,
    fontWeight: theme.typography.fontWeightMedium,
  },
  disabled: {
    color: theme.palette.primary.light,
    cursor: "default",
  }
}));

const CustomNavLink = (props) => {
  const { className, disabled, ...rest } = props;

  const handleClick = (e) => {
    if(disabled) e.preventDefault()
  }

  return (
    <NavLink
      className={className}
      style={{ flexGrow: 1 }}
      onClick={handleClick}
      {...rest}
    />
  );
};

CustomNavLink.propTypes = {
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  disabled: PropTypes.bool,
};

const SidebarNav = props => {
  const { pages, className, ...rest } = props;

  const classes = useStyles();


  return (
    <List
      {...rest}
      className={clsx(classes.root, className)}
    >
      {pages.map(page => (
        <ListItem
          className={classes.item}
          disableGutters
          key={page.title}
        >
          <CustomNavLink
            className={({ isActive }) => classes.button + (isActive ? (" " + classes.active) : "") + (page.disabled ? (" " + classes.disabled) : "")}
            target={page.external ? "_blank" : ""}
            to={page.href}
            disabled={page.disabled}
          >
            <div className={classes.icon}>{page.icon}</div>
            {page.title}
          </CustomNavLink>
        </ListItem>
      ))}
    </List>
  );
};

SidebarNav.propTypes = {
  className: PropTypes.string,
  pages: PropTypes.array.isRequired
};

export default SidebarNav;
