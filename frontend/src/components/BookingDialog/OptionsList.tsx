import React, { useEffect } from "react";
import { Table, TableBody, TableCell, TableFooter, TextField, Theme } from "@material-ui/core";
import TableRow from "@material-ui/core/TableRow";
import IconButton from "@material-ui/core/IconButton";
import { DeleteForever as DeleteIcon } from "@material-ui/icons";
import { makeStyles } from "@material-ui/styles";
import { useTranslation } from "react-i18next";
import { Controller } from "react-hook-form";
import InputAdornment from "@material-ui/core/InputAdornment";
import { formatCurrency } from "../../common/intlUtils";
import { Service } from "../../types";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import { useSelector } from "react-redux";
import * as selectors from "../../selectors";


const useStyles = makeStyles((theme: Theme) => ({
  table: {
    "& .MuiTableCell-sizeSmall": {
      padding: "6px 2px 6px 2px"
    }
  },
  cell: {},
  optionPriceInput: {
    fontSize: "medium",
    width: "5em"
  },
  formControl: {
    width: "100%"
  },
  deleteButton: {
    color: "red",
    margin: theme.spacing(1)
  }
}));

type OptionsListProps = {
  bookingId: number;
  form: any;
  optionsFieldArray: any;
  duration: number;
  variant: "filled" | "standard" | "outlined" | undefined;
};

const OptionsList: React.FunctionComponent<OptionsListProps> = ({
  bookingId,
  form,
  optionsFieldArray,
  duration,
  variant
}: OptionsListProps) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const { register, control, watch } = form;
  const { fields, append, remove } = optionsFieldArray;
  const options = watch("options", fields);
  const allOptions = useSelector(store => selectors.services(store));

  useEffect(() => {
    if (!bookingId) {
      console.log("Scan for automatic options", allOptions);
      allOptions.filter((o: Service) => o.auto_add_booking).forEach((option: Service) => {
        if (options.filter((o: Service) => o.id === option.id).length === 0) {
          console.log("  add automatic option:", option);
          append(option);
        }
      });
    }

  }, [allOptions, append, bookingId, options]);

  function getDesignation(option: Service) {
    return option.designation + (
      option.unit_price ? " - " + option.unit_price + "€" + (
        !option.is_flat_rate ? " / j" : ""
      ) : ""
    );
  }


  function onAddOption(data: any) {
    console.debug("ADD OPTION", data.target.value);
    const value = Number(data.target.value);
    const option = allOptions.filter((o: Service) => o.id === value)[0];
    append(option);
  }


  return (
    <Table className={classes.table} aria-label="simple table">
      <TableBody>
        {
          fields.map((option: Service, index: number) => (
            <TableRow key={option.id}>
              <input
                type="hidden" {...register(`options[${index}].id`)}
                defaultValue={option.id}
              />
              <input
                type="hidden" {...register(`options[${index}].designation`)}
                defaultValue={option.designation}
              />
              <input
                type="hidden" {...register(`options[${index}].vat`)}
                defaultValue={option.vat}
              />
              <input
                type="hidden" {...register(`options[${index}].not_included_in_price`)}
                defaultValue={option.not_included_in_price}
              />
              <TableCell>{option.designation}</TableCell>
              <TableCell>{options[index].unit_price && !options[index].is_flat_rate &&
              <span>{duration}&nbsp;x</span>}</TableCell>
              <TableCell>
                {options[index].unit_price &&
                <Controller
                  control={control}
                  name={"options[" + index + "].unit_price"}
                  // rules={{ valueAsNumber: true }}
                  render={({ field }) =>
                    <TextField
                      InputProps={{
                        endAdornment: <InputAdornment position="end">€</InputAdornment>,
                        type: "number"
                      }}
                      className={classes.optionPriceInput}
                      margin="dense"
                      defaultValue={option.unit_price}
                      required
                      // variant={variant}
                      {...field}
                    />}
                />}
              </TableCell>
              <TableCell>
                {options[index].unit_price &&
                <FormControlLabel
                  control={
                    <Controller
                      control={control}
                      name={"options[" + index + "].is_flat_rate"}
                      defaultValue={option.is_flat_rate}
                      render={({ field }) =>
                        <Checkbox
                          color="primary"
                          {...field}
                          checked={field.value}
                        />}
                    />
                  }
                  label={t("Flat rate")}
                  labelPlacement="start"
                />}
              </TableCell>
              <TableCell>
                {options[index].unit_price &&
                <span>=&nbsp;{formatCurrency((options[index] ? options[index].unit_price : option.unit_price) * ((options[index] ? options[index].is_flat_rate : option.is_flat_rate) ? 1 : duration))}</span>}
              </TableCell>
              <TableCell>
                <IconButton edge="end" aria-label="delete" className={classes.deleteButton} onClick={() => remove(index)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={6}>
            <FormControl className={classes.formControl} variant={variant}>
              <InputLabel htmlFor="booking-options">{t("Options")}</InputLabel>
              <Select
                inputProps={{
                  name: "options_select",
                  id: "booking-options"
                }}
                label={t("Options")}
                margin="dense"
                native
                value={0}
                onChange={onAddOption}
              >
                <option key={0} value={0}>{t("-- Add an option --")}</option>
                {allOptions.map((option: Service) => (
                  <option
                    key={option.id} value={option.id}
                    disabled={fields.filter((o: Service) => Number(o.id) === option.id).length > 0}
                  >
                    {getDesignation(option)}
                  </option>
                ))}
              </Select>
            </FormControl>
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
};

export default OptionsList;

