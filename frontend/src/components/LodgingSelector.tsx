import React from "react";
import { useTranslation } from "react-i18next";
import { Autocomplete, Checkbox, TextField } from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { useListLodgingsQuery } from "../services/api";
import { Lodging } from "../types";

type Props = {
  value: number[];
  onChange: (lodgingIds: number[]) => void;
};

const checkedIcon = <CheckBoxIcon fontSize="small" />;
const uncheckedIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;

/** Multi-select lodging filter, controlled the same way as `DateRangeSelector`.
 * An empty `value` means "no filter" (every lodging the user can see). */
const LodgingSelector: React.FunctionComponent<Props> = ({ value, onChange }: Props) => {
  const { t } = useTranslation();
  const { data: lodgings } = useListLodgingsQuery({ shown: true, active: true });
  const options = lodgings ?? [];
  const selected = options.filter(lodging => value.includes(lodging.id));

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={options}
      value={selected}
      onChange={(_event, newValue: Lodging[]) => onChange(newValue.map(lodging => lodging.id))}
      getOptionLabel={(lodging: Lodging) => lodging.name}
      isOptionEqualToValue={(option: Lodging, val: Lodging) => option.id === val.id}
      renderOption={(props, lodging, { selected: isSelected }) => (
        <li {...props} key={lodging.id}>
          <Checkbox icon={uncheckedIcon} checkedIcon={checkedIcon} checked={isSelected} style={{ marginRight: 8 }} />
          {lodging.name}
        </li>
      )}
      renderInput={params => (
        <TextField {...params} label={t("Lodgings")} placeholder={value.length ? undefined : t("All lodgings")} />
      )}
      sx={{ minWidth: 260 }}
      size="small"
    />
  );
};

export default LodgingSelector;
