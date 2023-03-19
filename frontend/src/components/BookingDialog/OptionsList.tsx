import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TextField,
  Theme,
  TableRow,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { DeleteForever as DeleteIcon } from "@mui/icons-material";
import { makeStyles } from "@mui/styles";
import { useTranslation } from "react-i18next";
import { Controller, FieldArrayWithId, useFieldArray } from "react-hook-form";
import { formatCurrency } from "../../common/intlUtils";
import { Service } from "../../types";


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
  form: any;
  duration: number;
  allOptions: Service[],
  variant: "filled" | "standard" | "outlined" | undefined;
};

const OptionsList: React.FunctionComponent<OptionsListProps> = ({
  allOptions,
  form,
  duration,
  variant
}: OptionsListProps) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const { register, control, watch } = form;
  const optionsFieldArray = useFieldArray({
    control,
    name: "options",
    keyName: "key"
  });
  const { fields, append, remove } = optionsFieldArray;
  const options = watch("options");

  function getDesignation(option: Service) {
    return option.designation + (
      option.unit_price ? " - " + option.unit_price + "€" + (
        !option.is_flat_rate ? " / j" : ""
      ) : ""
    );
  }


  function onAddOption(data: any) {
    if(allOptions) {
      console.debug("ADD OPTION", data.target.value);
      const value = Number(data.target.value);
      const option = allOptions.filter((o: Service) => o.id === value)[0];
      console.debug("  --> ", option);
      append(option);
    }
  }

  // console.log(options)
  return (
    <Table className={classes.table} aria-label="simple table">
      <TableBody>
        {
          fields.map((option: FieldArrayWithId<Service, never, string>, index: number) => (
            <TableRow key={option.key}>
              <TableCell>
                <input
                  type="hidden" {...register(`options.${index}.id` as const)}
                  defaultValue={option.id}
                />
                <input
                  type="hidden" {...register(`options.${index}.designation` as const)}
                  defaultValue={option.designation}
                />
                <input
                  type="hidden" {...register(`options.${index}.vat` as const)}
                  defaultValue={option.vat}
                />
                <input
                  type="hidden" {...register(`options.${index}.not_included_in_price` as const)}
                  defaultValue={option.not_included_in_price}
                />
                {option.designation}</TableCell>
              <TableCell>{option.unit_price && !options[index].is_flat_rate &&
              <span>{duration}&nbsp;x</span>}</TableCell>
              <TableCell>
                {option.unit_price &&
                <Controller
                  control={control}
                  name={`options.${index}.unit_price`}
                  // rules={{ valueAsNumber: true }}
                  render={({ field }) =>
                    <TextField
                      InputProps={{
                        endAdornment: <InputAdornment position="end">€</InputAdornment>,
                        type: "number"
                      }}
                      className={classes.optionPriceInput}
                      margin="dense"
                      required
                      // variant={variant}
                      {...field}
                    />}
                />}
              </TableCell>
              <TableCell>
                {option.unit_price &&
                <FormControlLabel
                  control={
                    <Controller
                      control={control}
                      name={`options.${index}.is_flat_rate`}
                      defaultValue={option.is_flat_rate}
                      render={({ field }) =>
                        <Checkbox
                          color="primary"
                          {...field}
                          checked={field.value}
                        />}
                    />
                  }
                  label={t<string>("Flat rate")}
                  labelPlacement="start"
                />}
              </TableCell>
              <TableCell>
                {option.unit_price &&
                <span>=&nbsp;{formatCurrency((options[index] ? options[index].unit_price : option.unit_price) * ((options[index] ? options[index].is_flat_rate : option.is_flat_rate) ? 1 : duration))}</span>}
              </TableCell>
              <TableCell>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  className={classes.deleteButton}
                  onClick={() => remove(index)}
                  size="large"
                >
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
                {allOptions && allOptions.map((option: Service) => (
                  <option
                    key={option.id} value={option.id}
                    disabled={options.filter((o: Service) => Number(o.id) === option.id).length > 0}
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

