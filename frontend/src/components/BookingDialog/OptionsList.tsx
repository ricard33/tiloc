import React from "react";
import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableRow
} from "@mui/material";
import { DeleteForever as DeleteIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useFieldArray } from "react-hook-form";
import { formatCurrency } from "../../common/intlUtils";
import { Service } from "../../types";
import { CheckboxElement, TextFieldElement } from "react-hook-form-mui";


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
    return `[${option.reference}] ` + option.designation + (
      option.unit_price ? " - " + option.unit_price + "€" + (
        !option.is_flat_rate ? " / j" : ""
      ) : ""
    );
  }


  function onAddOption(data: any) {
    if (allOptions) {
      const value = Number(data.target.value);
      const option = allOptions.filter((o: Service) => o.id === value)[0];
      append(option);
    }
  }

  return (
    <>
      <Paper>

        <Table
          sx={{ "& .MuiTableCell-sizeSmall": { padding: "6px 2px 6px 2px" }, fontSize: "small" }}
          aria-label="simple table"
        >
          <TableBody>
            {
              // `form` is untyped (`form: any`), so `useFieldArray` can't infer the row
              // shape; treat each row as the Service it holds (+ the `key` from keyName).
              (fields as unknown as Array<Service & { key: string }>).map((option, index: number) => (
                <React.Fragment key={option.key}>
                  <TableRow>
                    <TableCell colSpan={5} sx={{ borderBottom: 0 }}>
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
                  </TableRow>
                  <TableRow>
                    <TableCell>{Number(option.unit_price) >= 0 && !options[index].is_flat_rate &&
                      <span>{duration}&nbsp;x</span>}</TableCell>
                    <TableCell>
                      {Number(option.unit_price) >= 0 &&
                        <TextFieldElement
                          control={control}
                          name={`options.${index}.unit_price`}
                          sx={{ fontSize: "small", width: "5em" }}
                          type={"number"}
                          required
                          validation={{
                            min: { value: 0, message: t("Can't be negative") },
                            validate: { validateNumber: (v) => !isNaN(parseFloat(v)) }
                          }}
                          InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                          margin="dense"
                          size="small"
                          variant={"standard"}
                        />}
                    </TableCell>
                    <TableCell>
                      {Number(option.unit_price) >= 0 &&
                        <CheckboxElement
                          control={control}
                          name={`options.${index}.is_flat_rate`}
                          label={t("Flat rate")}
                          // rhf-mui types CheckboxElement's defaultValue as string-ish; the
                          // field is a boolean and was passed as-is before rhf 7 tightened this.
                          defaultValue={option.is_flat_rate as unknown as string}
                          color="primary"
                          size="small"
                          labelProps={{
                            labelPlacement: "start",
                            sx: { fontSize: "small", "& .MuiFormControlLabel-label": { fontSize: "small" } }
                          }}
                        />}
                    </TableCell>
                    <TableCell>
                      {Number(option.unit_price) >= 0 &&
                        <span>=&nbsp;{formatCurrency((options[index] ? options[index].unit_price : option.unit_price) * ((options[index] ? options[index].is_flat_rate : option.is_flat_rate) ? 1 : duration))}</span>}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        sx={{ color: "red", margin: 1 }}
                        onClick={() => remove(index)}
                        size="large"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                </React.Fragment>

              ))}
          </TableBody>
        </Table>
      </Paper>
      <FormControl variant={variant} sx={{ marginTop: 2, width: "100%" }}>
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
            >
              {getDesignation(option)}
            </option>
          ))}
        </Select>
      </FormControl>
    </>
  );
};

export default OptionsList;

