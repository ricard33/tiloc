import React, {  } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { formatISO } from "../common/tzUtils";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, InputAdornment, MenuItem,
  TextField
} from "@mui/material";
import DatePicker from '@mui/lab/DatePicker';
import makeStyles from '@mui/styles/makeStyles';
import { Payment, paymentMethods } from "../types";
import { parseISO } from "date-fns";


const useStyles = makeStyles((/*theme: Theme*/) => ({
  input: {
    marginLeft: "4px",
    marginRight: "4px",
  },
  date: {
    marginLeft: "4px",
    marginRight: "4px",
    width: "8em"
  },
  description: {
    marginLeft: "4px",
    marginRight: "4px",
  },
  method: {
    marginLeft: "4px",
    marginRight: "4px",
    width: "10em"
  },
  amount: {
    marginLeft: "4px",
    marginRight: "4px",
    width: "5em"
  },
}));

type Props = {
  open: boolean;
  bookingId: number;
  onAdd: (payment: Payment) => void;
  onClose: () => void;
};

const PaymentDialog: React.FunctionComponent<Props> = ({ open, bookingId, onAdd, onClose }: Props) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const { register, handleSubmit, control, formState: { errors } } = useForm<Payment>();
  const onSubmit: SubmitHandler<Payment> = data => {
    // noinspection SuspiciousTypeOfGuard
    const date = typeof data.date === "string" ? parseISO(data.date) : data.date;
    onAdd({
      ...data,
      date: formatISO(date),
      amount: Number(data.amount)
    });
  };
  const variant = "standard";

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if(event.key === 'Enter'){
      handleSubmit(onSubmit)(event);
      event.preventDefault();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title" maxWidth="md">
      <DialogTitle id="form-dialog-title">{t("Add payment")}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type="hidden"
            {...register("booking")}
            defaultValue={bookingId}
          />
          <Controller
            name="date"
            control={control}
            defaultValue={new Date().toISOString()}
            render={({ field }) =>
              <DatePicker
                inputFormat="dd/MM/yyyy"
                renderInput={(props) => <TextField label={t("date")} variant={variant} {...props} />}
                className={classes.date}
                {...field}
              />}
          />
          <Controller
            name="description"
            control={control}
            defaultValue={""}
            rules={{ required: true }}
            render={({ field }) =>
              <TextField
                label={t("description")}
                variant={variant}
                className={classes.description}
                error={!!errors.description}
                helperText={errors.description?.type === "required" && t("The description is required")}
                {...field}
              />}
          />
          <Controller
            name="method"
            control={control}
            defaultValue={""}
            rules={{ required: true }}
            render={({ field }) =>
              <TextField
                label={t("payment method")}
                variant={variant}
                className={classes.method}
                select
                error={!!errors.method}
                helperText={errors.method?.type === "required" && t("The payment method is required")}
                {...field}
              >
                {paymentMethods(t).map(m => <MenuItem key={m[0]} value={m[0]}>{m[1]}</MenuItem>)}
              </TextField>}
          />
          <Controller
            name="amount"
            control={control}
            defaultValue={0}
            rules={{ required: true }}
            render={({ field }) =>
              <TextField
                label={t("amount")}
                variant={variant}
                className={classes.amount}
                error={!!errors.amount}
                helperText={errors.amount?.type === "required" && t("The amount is required")}
                onKeyPress={handleKeyPress}
                InputProps={{
                  endAdornment: <InputAdornment position="end">€</InputAdornment>,
                  type: "number"
                }}
                {...field}
              />}
          />

        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {t("Cancel")}
        </Button>
        <Button onClick={handleSubmit(onSubmit)} color="primary" type="submit">
          {t("Add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;

