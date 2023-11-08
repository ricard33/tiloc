import React from "react";
import Page from "../../layouts/Main/Page";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { User } from "../../types";
import { Link as RouterLink } from "react-router-dom";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import HotelIcon from "@mui/icons-material/Hotel";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { ReactComponent as BookingSourcesIcon } from "../../assets/icones/booking-sources.svg";
import { styled } from "@mui/material/styles";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";


const BigButton = styled(ButtonBase)(({ theme }) => ({
  position: "relative",
  height: 200,
  backgroundColor: "#3f51b5",
  [theme.breakpoints.down("sm")]: {
    width: "100% !important", // Overrides inline-style
    height: 100
  },
  "&:hover, &.Mui-focusVisible": {
    zIndex: 1,
    "& .MuiImageBackdrop-root": {
      opacity: 0.15
    },
    "& .MuiImageMarked-root": {
      opacity: 0
    },
    "& .MuiTypography-root": {
      border: "4px solid currentColor"
    }
  }
}));

const ImageSrc = styled("span")({
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundSize: "cover",
  backgroundPosition: "center 40%"
});

const Image = styled("span")(({ theme }) => ({
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: theme.palette.common.white
}));

const ButtonBackdrop = styled("span")(({ theme }) => ({
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundColor: theme.palette.common.black,
  opacity: 0.4,
  transition: theme.transitions.create("opacity")
}));

const ButtonIcon = styled("span")(({ theme }) => ({
  position: "absolute",
  top: 20,
  left: "30%",
  right: "30%",
  fontSize: 60,
  color: "white",
  [theme.breakpoints.down("sm")]: {
    top: 10,
    opacity: 0.3,
  },
}));

const ImageMarked = styled("span")(({ theme }) => ({
  height: 3,
  width: 18,
  backgroundColor: theme.palette.common.white,
  position: "absolute",
  bottom: -2,
  left: "calc(50% - 9px)",
  transition: theme.transitions.create("opacity")
}));


function SettingsIndex() {
  const { t } = useTranslation();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canViewUsers = user.permissions.includes("core.view_user");

  const pages = [
    // {
    //   title: t("General parameters"),
    //   href: "",
    //   icon: SettingsIcon,
    //   disabled: false
    // },
    ...(canViewUsers ? [{
      title: t("Users"),
      href: "users",
      icon: PeopleAltIcon,
      disabled: false
    }] : []),
    {
      title: t("Lodgings"),
      href: "lodgings",
      icon: HotelIcon
    },
    {
      title: t("Services"),
      href: "services",
      icon: RoomServiceIcon
    },
    {
      title: t("Contract templates"),
      href: "contract-templates",
      icon: DashboardIcon
    },
    {
      title: t("Booking channels"),
      href: "booking-channels",
      icon: BookingSourcesIcon
    },
    {
      title: t("Calendars sync"),
      href: "calendar-syncs",
      icon: CalendarMonthIcon
    }
  ];

  return (
    <Page sx={{ display: "flex", flexFlow: "row", flexWrap: "wrap", flex: "0 1 auto", justifyContent: "space-evenly" }}>
      {pages.map((page) => {
        const Icon = page.icon;
        return (
          <BigButton
            focusRipple
            key={page.title}
            // @ts-ignore
            component={RouterLink} to={page.href}
            style={{
              width: "30%",
              flex: "0 0 200px",
              margin: "5px 10px"
            }}
          >
            <ImageSrc />
            <ButtonBackdrop className="MuiImageBackdrop-root" />
            <Image>
              <ButtonIcon>
                <Icon sx={{ width: "100%", height: "100%", color: "white" }}/>
              </ButtonIcon>
              <Typography
                component="span"
                variant="subtitle1"
                color="inherit"
                sx={{
                  position: "absolute",
                  bottom: 20,
                  padding: 2,
                  // paddingTop: 4,
                  // padding: (theme) => `calc(${theme.spacing(1)} + 6px)`
                }}
              >
                {page.title}
                <ImageMarked className="MuiImageMarked-root" />
              </Typography>
            </Image>
          </BigButton>
        );
      })}    </Page>
  );
}

export default SettingsIndex;
