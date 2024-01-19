import React from "react";
import { useTranslation } from "react-i18next";
import { useListBookingChannelsQuery } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { BookingChannel, User } from "../../types";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import Page from "../../layouts/Main/Page";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import GridToolbar from "../../components/GridToolbar";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import { BookingSource } from "../../common/statusUtils";

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  "& .booking-channel-list-readonly": {
    cursor: "not-allowed"
  }
}));

type Props = {};

const BookingChannelList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const { data } = useListBookingChannelsQuery({}, { refetchOnMountOrArgChange: 20 });
  const navigate = useNavigate();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_bookingchannel");

  const columns: GridColDef[] = [
    // { field: "id", headerName: "ID", width: 70 },
    {
      field: "name", headerName: t("Name"), width: 400,
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <BookingSource name={params.value} />
      )

    }
  ];

  const onClick = (bookingChannel: BookingChannel) => {
    if (bookingChannel.read_only) {
      return;
    }
    navigate(bookingChannel.id.toString());
  };

  const onCreateBookingChannel = () => {
    navigate("new");
  };

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <Paper sx={{ padding: 0, height: "100%" }}>
        <StyledDataGrid
          sx={{
            flex: "1 1 auto",
            minHeight: "300px"
          }}
          rows={data || []}
          columns={columns}
          autoPageSize
          // pageSize={20}
          // pageSizeOptions={[5, 10, 20, 50]}
          onRowClick={(params) => onClick(params.row)}
          getRowClassName={(params) => params.row.read_only ? "booking-channel-list-readonly" : ""}
          slots={{
            toolbar: GridToolbar
          }}
          slotProps={{
            toolbar: {
              showColumnsButton: true,
              showDensitySelector: true,
              showFilterButton: true,
              tools: [{ label: t("Create"), onClick: onCreateBookingChannel, disabled: !canAdd }]
            }
          }}
        />
      </Paper>
    </Page>
  );
};

export default BookingChannelList;
