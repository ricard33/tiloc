import React, {  } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, InputAdornment, MenuItem,
  TextField,
} from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers';
import makeStyles from "@mui/styles/makeStyles";
import { Payment, paymentMethods } from "../types";


const useStyles = makeStyles((/*theme: Theme*/) => ({
  input: {
    marginLeft: "4px",
    marginRight: "4px"
  },
  date: {
    marginLeft: "4px",
    marginRight: "4px",
    width: "8em"
  },
  description: {
    marginLeft: "4px",
    marginRight: "4px"
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
  }
}));

type Props = {
  payment?: Omit<Payment, 'booking'>;
  bookingId: number;
  onValidate: (payment: Payment) => void;
  onClose: () => void;
};

const PaymentDialog: React.FunctionComponent<Props> = ({ payment, bookingId, onValidate, onClose }: Props) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const { register, handleSubmit, control, formState: { errors } } = useForm<Payment>();
  const onSubmit: SubmitHandler<Payment> = data => {
    onValidate({
      ...data,
      amount: Number(data.amount)
    });
  };
  const variant = "standard";

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSubmit(onSubmit)(event);
      event.preventDefault();
    }
  };

  return (
    <Dialog open={payment !== null} onClose={onClose} aria-labelledby="form-dialog-title" maxWidth="md">
      <DialogTitle id="form-dialog-title">{payment!.id ? t("Modify payment") : t("Add payment")}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type="hidden"
            {...register("booking_id")}
            defaultValue={payment!.booking_id}
          />
          <Controller
            name="date"
            control={control}
            defaultValue={payment!.id ? payment!.date : new Date()}
            render={({ field }) =>
              <DatePicker
                label={t("date")}
                openTo="day"
                views={["year", "month", "day"]}
                format="dd/MM/yyyy"
                slotProps={{ textField: { variant: variant } }}
                className={classes.date}
                {...field}
                onChange={date => field.onChange(date!)}
              />}
          />
          <Controller
            name="description"
            control={control}
            defaultValue={payment!.id ? payment!.description : ""}
            rules={{ required: true }}
            render={({ field }) =>
              <TextField
                label={t("description")}
                variant={variant}
                className={classes.description}
                onKeyPress={handleKeyPress}
                error={!!errors.description}
                helperText={errors.description?.type === "required" && t("The description is required")}
                {...field}
              />}
          />
          <Controller
            name="method"
            control={control}
            defaultValue={payment!.id ? payment!.method : ""}
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
            defaultValue={payment!.id ? payment!.amount : 0}
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
          {payment!.id ? t("Modify") : t("Add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;

