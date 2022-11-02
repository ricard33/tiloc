/* eslint-disable react/no-multi-comp */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import React from "react";
import { NavLink, NavLinkProps } from "react-router-dom";
import clsx from "clsx";
import { makeStyles } from "@mui/styles";
import { colors, List, ListItem, ListProps, Theme } from "@mui/material";

const useStyles = makeStyles((theme: Theme) => ({
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

    display: "inline-flex",
    position: "relative",
    boxSizing: "border-box",
    backgroundColor: "transparent",
    outline: "0px",
    border: "0px",
    margin: "0px",
    cursor: "pointer",
    verticalAlign: "middle",
    appearance: "none",
    textDecoration: "none",
    fontSize: "0.8125rem",
    lineHeight: 1.75,
    textTransform: "uppercase",
    minWidth: "64px",
    "&:hover": {
      backgroundColor: theme.palette.action.hover
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
    fontWeight: theme.typography.fontWeightMedium
  },
  disabled: {
    color: theme.palette.primary.light,
    cursor: "default"
  }
}));

export interface CustomNavLinkProps extends NavLinkProps {
  className: string | (({ isActive }: { isActive: boolean; }) => string);
  disabled: boolean;
}

const CustomNavLink = React.forwardRef<HTMLAnchorElement, CustomNavLinkProps>((props, ref) => {
  const { className, disabled, ...rest } = props;

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) e.preventDefault();
  };

  return (
    <NavLink
      ref={ref}
      className={className}
      style={{ flexGrow: 1 }}
      onClick={handleClick}
      {...rest}
    />
  );
});


type Page = {
  title: string;
  href: string;
  icon: React.ReactElement;
  external?: boolean;
  disabled?: boolean;
}

export interface SidebarNavProps extends ListProps {
  className: string;
  pages: Page[];
}

const SidebarNav: React.FunctionComponent<SidebarNavProps> = props => {
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
          {page.external ?
            <a
              className={classes.button + (page.disabled ? (" " + classes.disabled) : "")}
              target={"_blank"}
              href={page.href} rel="noreferrer"
            >
              <div className={classes.icon}>{page.icon}</div>
              {page.title}
            </a>
            :
            <CustomNavLink
              className={({ isActive }) => classes.button + (isActive ? (" " + classes.active) : "") + (page.disabled ? (" " + classes.disabled) : "")}
              target={page.external ? "_blank" : ""}
              to={page.href}
              disabled={page.disabled ?? false}
            >
              <div className={classes.icon}>{page.icon}</div>
              {page.title}
            </CustomNavLink>
          }
        </ListItem>
      ))}
    </List>
  );
};

export default SidebarNav;
