import React from "react";

import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateCalendarSyncMutation, useDeleteCalendarSyncMutation,
  useGetCalendarSyncQuery, useListBookingChannelsQuery, useListLodgingsQuery,
  useUpdateCalendarSyncMutation
} from "../../services/api";
import Page from "../../layouts/Main/Page";
import { useTranslation } from "react-i18next";
import { CalendarSyncForm } from "./CalendarSyncForm";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useConfirm } from "../../libs/MuiConfirm";
import { CalendarSync, User } from "../../types";

export default function CalendarSyncPage() {
  const { t } = useTranslation();
  let { calendarSyncId } = useParams();
  console.log("calendarSyncId", calendarSyncId, typeof calendarSyncId);
  const {
    data: calendarSync,
    isLoading
  } = useGetCalendarSyncQuery(Number(calendarSyncId), { skip: typeof calendarSyncId === "undefined" });
  const [createCalendarSync] = useCreateCalendarSyncMutation();
  const [updateCalendarSync] = useUpdateCalendarSyncMutation();
  const [deleteCalendarSync] = useDeleteCalendarSyncMutation();
  const { data: bookingChannels, isLoading: isChannelsLoading } = useListBookingChannelsQuery();
  const { data: lodgings, isLoading: isLodgingsLoading } = useListLodgingsQuery();

  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canChange = user.permissions.includes("core.change_bookingchannelsync");
  const canDelete = user.permissions.includes("core.delete_bookingchannelsync");
  const { showError, showSuccess } = useAlert();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const onCancel = () => {
    navigate(-1);
  };

  const onDelete = async (calendarSync: CalendarSync) => {
    if (!canDelete) return await Promise.resolve();
    return confirm({
      title: t("Delete calendar synchronization for {{ lodging }} on {{ channel }}", {
        lodging: calendarSync.lodging.name,
        channel: calendarSync.channel.name
      }),
      description: t("Do you really want to permanently delete this calendar synchronization?")
    })
      .then(() => {
        return deleteCalendarSync(calendarSync).then((result) => {
          if ((result as any).error) {
            const error = (result as any).error;
            console.error("Error deleting calendarSync", error);
            showError(t("Impossible to delete the calendar synchronization: ") + fetchErrorDecode(error));
          } else {
            showSuccess(t("Calendar synchronization deleted"));
            navigate(-1);
          }
        });
      })
      .catch(() => { /* ... */
      });
  };


  const onSubmit = (data: CalendarSync) => {
    // console.log(data);
    if (!calendarSync || !calendarSync.id) {
      createCalendarSync(data).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during calendarSync creation", error);
          showError(t("Impossible to create calendar synchronization: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Calendar synchronization added"));
          navigate(-1);
        }
      });
    } else {
      updateCalendarSync({ ...calendarSync, ...data }).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during calendarSync change", error);
          showError(t("Impossible to modify calendar synchronization: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Calendar synchronization changed"));
          navigate(-1);
        }
      });
    }
  };

  if (isLoading || isChannelsLoading || isLodgingsLoading) return <div>{t("Loading...")}</div>;
  return (
    <Page>
      <CalendarSyncForm
        calendarSync={calendarSync}
        lodgings={lodgings!}
        channels={bookingChannels!}
        onSubmit={canChange ? onSubmit : undefined} onCancel={onCancel}
        onDelete={canDelete ? onDelete : undefined}
      />
    </Page>
  );
}
