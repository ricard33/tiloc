import React  from "react";
import { Table, TableBody, TableCell, Theme } from "@material-ui/core";
import TableRow from "@material-ui/core/TableRow";
import { formatDate } from "../common/dateUtils";
import { DecimalPrecision } from "../common/priceUtils";
import IconButton from "@material-ui/core/IconButton";
import { DeleteForever as DeleteIcon } from "@material-ui/icons";
import { Payment } from "../types/models";
import { makeStyles } from "@material-ui/styles";
import { parseISO } from "date-fns";


const useStyles = makeStyles((theme: Theme) => ({
  table: {},
  deleteButton: {
    color: "red",
    margin: theme.spacing(1)
  },
}));

type PaymentListProps = {
    payments: Payment[];
    onDelete: (payment: Payment) => void;
};

const PaymentList: React.FunctionComponent<PaymentListProps> = ({ payments, onDelete }: PaymentListProps) => {
  const classes = useStyles();
  return (
    <Table className={classes.table} aria-label="simple table">
      <TableBody>
        {payments && payments.map(p => (
          <TableRow key={p.id}>
            <TableCell>{formatDate(parseISO(p.date))}</TableCell>
            <TableCell>{p.description}</TableCell>
            <TableCell>{p.method}</TableCell>
            <TableCell>{DecimalPrecision.round(Number(p.amount))} &euro;</TableCell>
            <TableCell>
              <IconButton edge="end" aria-label="delete" className={classes.deleteButton} onClick={() => onDelete(p)}>
                <DeleteIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PaymentList;

