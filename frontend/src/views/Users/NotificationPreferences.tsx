import React from "react";
import { Card, CardContent, CardHeader, Divider, Switch, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNotificationPreferencesQuery, useUpdateNotificationPreferenceMutation } from "../../services/api";
import { useAlert } from "../../common/alertUtils";
import { fetchErrorDecode } from "../../common/apiUtils";

const BACKEND_LABELS: Record<string, string> = {
  noop: "In-app",
  email: "Email"
};

export function NotificationPreferences() {
  const { t } = useTranslation();
  const { data: preferences } = useNotificationPreferencesQuery();
  const [updatePreference] = useUpdateNotificationPreferenceMutation();
  const { showError } = useAlert();

  const onToggle = (name: string, backends: Record<string, boolean>, backend: string, checked: boolean) => {
    updatePreference({ name, backends: { ...backends, [backend]: checked } }).then(result => {
      if ((result as any).error) {
        showError(t("Impossible to update notification preferences: ") + fetchErrorDecode((result as any).error));
      }
    });
  };

  return (
    <Card>
      <CardHeader title={t("Notifications")} />
      <Divider />
      <CardContent>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("Notification")}</TableCell>
              <TableCell align="center">{t("In-app")}</TableCell>
              <TableCell align="center">{t("Email")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(preferences ?? []).map(row => (
              <TableRow key={row.name}>
                <TableCell>{row.display_name}</TableCell>
                {["noop", "email"].map(backend => (
                  <TableCell align="center" key={backend}>
                    {backend in row.backends && (
                      <Switch
                        checked={row.backends[backend]}
                        onChange={(_event, checked) => onToggle(row.name, row.backends, backend, checked)}
                        inputProps={{ "aria-label": `${row.display_name} - ${BACKEND_LABELS[backend] ?? backend}` }}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default NotificationPreferences;
