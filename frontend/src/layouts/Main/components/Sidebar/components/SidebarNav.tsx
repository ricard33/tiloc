 
 
import React from "react";
import { NavLink, NavLinkProps } from "react-router-dom";
import clsx from "clsx";
import { colors, List, ListItem, ListProps } from "@mui/material";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";


const StyledNavLink = styled(NavLink)(({ theme }) => ({
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
  },
  "&.active": {
    color: theme.palette.primary.main,
    fontWeight: theme.typography.fontWeightMedium
  },
  "&.disabled": {
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
    <StyledNavLink
      ref={ref}
      className={className}
      style={{ flexGrow: 1 }}
      onClick={handleClick}
      {...rest}
    />
  );
});

CustomNavLink.displayName = "CustomNavLink";

type Page = {
  title: string;
  href: string;
  icon: React.ReactElement;
  external?: boolean;
  disabled?: boolean;
  premium?: boolean;
}

export type SidebarNavProps = ListProps & {
  pages: Page[];
}

const SidebarNav: React.FunctionComponent<SidebarNavProps> = props => {
  const { pages, ...rest } = props;


  return (
    <List
      {...rest}
    >
      {pages.map(page => (
        <ListItem
          sx={{ display: "flex", paddingTop: 0, paddingBottom: 0 }}
          disableGutters
          key={page.title}
        >
          <CustomNavLink
            className={({ isActive }) => clsx({ active: isActive, disabled: page.disabled })}
            target={page.external ? "_blank" : ""}
            to={page.premium ? "/upgrade-plan" : page.href}
            disabled={page.disabled ?? false}
          >
            <Box
              sx={{ width: "24px", height: "24px", display: "flex", alignItems: "center", marginRight: 1 }}
            >{page.icon}</Box>
            {page.title}
            {page.premium &&
              <WorkspacePremiumIcon
                color="warning" sx={{ position: "absolute", top: 0, right: 0 }}
                fontSize="small"
              />
            }
          </CustomNavLink>
        </ListItem>
      ))}
    </List>
  );
};

export default SidebarNav;
