import React from "react";
import { useTranslation } from "react-i18next";
import { useListBookingChannelsQuery } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { BookingChannel, User } from "../../types";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { formatPercent, formatPrice } from "../../common/priceUtils";
import Page from "../../layouts/Main/Page";
import ListToolbar from "../../components/ListToolbar";
import { Card, CardContent } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

type Props = {};

const BookingChannelList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const { data } = useListBookingChannelsQuery({}, { refetchOnMountOrArgChange: 20 });
  const navigate = useNavigate();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_bookingchannel");

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: t("Name"), width: 400 },
    { field: "default_booking_status", headerName: t("Default booking status"), width: 170, valueFormatter: params => params.value ? params.value.name : "-" },
  ];

  const onClick = (bookingChannel: BookingChannel) => {
    navigate(bookingChannel.id.toString());
  };

  const onCreateBookingChannel = () => {
    navigate("new");
  };

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <ListToolbar
        title={t("Booking channels")}
        tools={[
          { label: t("Create"), onClick: onCreateBookingChannel, disabled: !canAdd }
        ]}
      />
      <Card sx={{ flex: "1 1 auto", marginTop: "16px" }}>
        <CardContent sx={{ padding: 0, height: "100%" }}>
          <DataGrid
            sx={{
              flex: "1 1 auto",
              minHeight: "300px"
            }}
            rows={data || []}
            columns={columns}
            pageSize={20}
            rowsPerPageOptions={[5, 10, 20, 50]}
            onRowClick={(params) => onClick(params.row)}
            components={{
              Toolbar: GridToolbar
            }}
          />
        </CardContent>
      </Card>
    </Page>
  );
};

export default BookingChannelList;
