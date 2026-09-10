import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Page from "../../layouts/Main/Page";
import { RootState } from "../../store";
import { SeasonCalendar, User } from "../../types";
import { useAlert } from "../../common/alertUtils";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useConfirm } from "../../libs/MuiConfirm";
import {
  useCreateSeasonCalendarMutation,
  useDeleteSeasonCalendarMutation,
  useGetSeasonCalendarQuery,
  useUpdateSeasonCalendarMutation
} from "../../services/api";
import { SeasonCalendarForm } from "./SeasonCalendarForm";

export function SeasonCalendarPage() {
  const { t } = useTranslation();
  const { calendarId } = useParams();
  const { data: calendar, isLoading } = useGetSeasonCalendarQuery(Number(calendarId), {
    skip: typeof calendarId === "undefined"
  });
  const [createSeasonCalendar] = useCreateSeasonCalendarMutation();
  const [updateSeasonCalendar] = useUpdateSeasonCalendarMutation();
  const [deleteSeasonCalendar] = useDeleteSeasonCalendarMutation();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canChange = user.permissions.includes("core.change_seasoncalendar");
  const canDelete = user.permissions.includes("core.delete_seasoncalendar");
  const { showError, showSuccess } = useAlert();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const onCancel = () => navigate(-1);

  const onDelete = async (calendar: SeasonCalendar) => {
    if (!canDelete) return;
    return confirm({
      title: t("Delete season calendar: {{ name }}", { name: calendar.name }),
      description: calendar.lodging_count
        ? t("This calendar is used by {{count}} lodging(s). They will fall back to their default rate.", {
          count: calendar.lodging_count
        })
        : t("Do you really want to permanently delete this season calendar?")
    })
      .then(() =>
        deleteSeasonCalendar(calendar).then((result) => {
          if ((result as any).error) {
            showError(t("Impossible to delete: ") + fetchErrorDecode((result as any).error));
          } else {
            showSuccess(t("Season calendar deleted"));
            navigate(-1);
          }
        })
      )
      .catch(() => { /* dismissed */ });
  };

  const onSubmit = (data: SeasonCalendar) => {
    const mutation = calendar && calendar.id
      ? updateSeasonCalendar({ ...calendar, ...data })
      : createSeasonCalendar(data);
    mutation.then((result) => {
      if ((result as any).error) {
        showError(t("Impossible to save: ") + fetchErrorDecode((result as any).error));
      } else {
        showSuccess(calendar && calendar.id ? t("Season calendar changed") : t("Season calendar added"));
        navigate(-1);
      }
    });
  };

  if (isLoading) return <div>{t("Loading...")}</div>;
  return (
    <Page>
      <SeasonCalendarForm
        calendar={calendar}
        onSubmit={canChange ? onSubmit : undefined}
        onCancel={onCancel}
        onDelete={canDelete ? onDelete : undefined}
      />
    </Page>
  );
}
