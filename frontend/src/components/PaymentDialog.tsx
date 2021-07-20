import React, {  } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { Payment } from "../types/models";
import { useTranslation } from "react-i18next";
import { formatISO } from "../common/tzUtils";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle, InputAdornment, MenuItem,
  TextField, Theme
} from "@material-ui/core";
import { KeyboardDatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import { makeStyles } from "@material-ui/styles";


const useStyles = makeStyles((theme: Theme) => ({
  date: {
    width: "8em"
  },
  description: {},
  method: {
    width: "10em"
  },
  amount: {
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
    console.log(data);
    onAdd(data);
  };
  const variant = "outlined";

  const paymentMethods = [
    ['cash', t('Cash')],
    ['bank_card', t('Bank card')],
    ['check', t('Check')],
    ['transfer', t('Transfer')],
    ['paypal', t('PayPal')],
    ['vouchers', t('Holiday vouchers')],
    ['other', t('Other')],
  ]

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Subscribe</DialogTitle>
      <DialogContent>
        <DialogContentText>
          To subscribe to this website, please enter your email address here. We will send updates
          occasionally.
        </DialogContentText>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type="hidden"
            {...register("booking")}
            defaultValue={bookingId}
          />
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <Controller
              name="date"
              control={control}
              defaultValue={formatISO(new Date())}
              render={({ field }) => <KeyboardDatePicker
                id="payment-date-picker"
                KeyboardButtonProps={{
                  "aria-label": "date"
                }}
                format="dd/MM/yyyy"
                label={t("date")}
                margin="dense"
                variant="inline"
                className={classes.date}
                inputVariant={variant}
                autoOk
                {...field}
              />}
            />
          </MuiPickersUtilsProvider>
          <Controller
            name="description"
            control={control}
            defaultValue={""}
            rules={{ required: true }}
            render={({ field }) => <TextField
              label={t("description")}
              margin="dense"
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
            render={({ field }) => <TextField
              label={t("payment method")}
              margin="dense"
              variant={variant}
              className={classes.method}
              select
              error={!!errors.method}
              helperText={errors.method?.type === "required" && t("The payment method is required")}
              {...field}
            >
              {paymentMethods.map(m => <MenuItem key={m[0]} value={m[0]}>{m[1]}</MenuItem>)}
            </TextField>}
          />
          <Controller
            name="amount"
            control={control}
            defaultValue={0}
            rules={{ required: true }}
            render={({ field }) => <TextField
              label={t("amount")}
              margin="dense"
              variant={variant}
              className={classes.amount}
              error={!!errors.amount}
              helperText={errors.amount?.type === "required" && t("The amount is required")}
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
        <Button onClick={onClose} color="default">
          {t("Cancel")}
        </Button>
        <Button onClick={handleSubmit(onSubmit)} color="primary" type="submit">
          {t("Add")}
        </Button>
      </DialogActions>
    </Dialog>)
  ;
};

export default PaymentDialog;

