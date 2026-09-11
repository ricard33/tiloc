import React from "react";
import { Card, CardContent, CardHeader, Divider, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../../app/hooks";
import { useListLodgingsQuery } from "../../../services/api";
import { formatCurrency } from "../../../common/intlUtils";
import { User } from "../../../types";
import { FillingRateRow } from "../types";

type Props = {
  data: FillingRateRow[];
};

type LodgingTotals = {
  turnover: number;
  days: number;
};

const LodgingRanking: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const user = useAppSelector(store => store.auth.user) as User;
  const canViewPrices = user.permissions.includes("core.view_prices");
  const { data: lodgings } = useListLodgingsQuery({ shown: true, active: true });

  const rows = (lodgings ?? [])
    .map(lodging => {
      const totals = data.reduce(
        (acc, row) => {
          const perLodging = row[lodging.id] as Partial<LodgingTotals> | undefined;
          return {
            turnover: acc.turnover + (perLodging?.turnover ?? 0),
            days: acc.days + (perLodging?.days ?? 0),
          };
        },
        { turnover: 0, days: 0 }
      );
      return { lodging, ...totals };
    })
    .sort((a, b) => (canViewPrices ? b.turnover - a.turnover : b.days - a.days));

  return (
    <Card>
      <CardHeader title={t("Lodgings ranking")} />
      <Divider />
      <CardContent>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("Lodging")}</TableCell>
              <TableCell align="right">{t("Occupied nights")}</TableCell>
              {canViewPrices && <TableCell align="right">{t("Turnover")}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(row => (
              <TableRow key={row.lodging.id}>
                <TableCell>{row.lodging.name}</TableCell>
                <TableCell align="right">{row.days}</TableCell>
                {canViewPrices && <TableCell align="right">{formatCurrency(row.turnover)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LodgingRanking;
