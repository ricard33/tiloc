import React from "react";
import {
  Control,
  Controller,
  ControllerProps,
  FieldError,
  Path,
} from 'react-hook-form'
import {FieldValues} from 'react-hook-form/dist/types/fields'
import { useFormError } from "react-hook-form-mui";
import { MuiColorInput, MuiColorInputProps } from "mui-color-input";

export type ColorPickerElementProps<T extends FieldValues = FieldValues> = Omit<
  MuiColorInputProps,
  'name'|'value'
> & {
  validation?: ControllerProps["rules"]
  name: Path<T>
  parseError?: (error: FieldError) => string
  control?: Control<T>
}

export default function ColorPickerElement<
  TFieldValues extends FieldValues = FieldValues
>({
  validation = {},
  parseError,
  required,
  name,
  control,
  ...rest
}: ColorPickerElementProps<TFieldValues>): JSX.Element {
  const errorMsgFn = useFormError()
  const customErrorFn = parseError || errorMsgFn
  if (required && !validation.required) {
    validation.required = 'This field is required'
  }


  return (
    <Controller
      name={name}
      control={control as any}
      rules={validation}
      render={({
        field: {value, onChange, onBlur, ref},
        fieldState: {error},
      }) => (
        <MuiColorInput
          {...rest}
          name={name}
          value={value ?? ''}
          onChange={(value, colors) => {
            onChange(colors.hex);
            if (typeof rest.onChange === 'function') {
              rest.onChange(value, colors);
            }
          }}
          onBlur={onBlur}
          required={required}
          error={!!error}
          helperText={
            error
              ? typeof customErrorFn === 'function'
                ? customErrorFn(error)
                : error.message
              : rest.helperText
          }
          inputRef={ref}
        />
      )}
    />
  )
}
