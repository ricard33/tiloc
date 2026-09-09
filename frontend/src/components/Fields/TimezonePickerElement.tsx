import React from "react";
import { AutocompleteElement, AutocompleteElementProps } from "react-hook-form-mui";
import { getTimeZoneOptions } from "../../common/timezones";
import { FieldValues } from "react-hook-form/dist/types/fields";

type AutoDefault = {
  id: string | number;
  label: string;
};

type TimezonePickerElementProps<TFieldValues extends FieldValues> = Omit<AutocompleteElementProps<TFieldValues, AutoDefault | string | any, boolean | undefined, boolean | undefined>, "options" | "autocompleteProps">

export function TimezonePickerElement<TFieldValues extends FieldValues>(props: TimezonePickerElementProps<TFieldValues>) {
  // for populating the timezones object
  const timezones = React.useMemo(() => {
    return getTimeZoneOptions(false).map(tz => tz.id);
  }, []);
  return (
    <AutocompleteElement
      options={timezones}
      autocompleteProps={{
        disableClearable: true,
        onChange: (_event, value) => {
          console.log(value);
        },
        isOptionEqualToValue: (option, value) => {
          // console.log(option, value);
          return option === value;
        }
      }}
      {...props}
    />
  );
}
