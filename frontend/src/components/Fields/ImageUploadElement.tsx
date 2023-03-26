import React, { ChangeEvent, useState } from "react";
import { Path, useFormContext } from "react-hook-form";
import { FieldValues } from "react-hook-form/dist/types/fields";
import { useTranslation } from "react-i18next";
import { Button, FormControl, FormHelperText, FormLabel, Paper, Stack, TextFieldProps } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import NoImage from "../../assets/images/no-image.png";


type ImageUploadElementProps<T extends FieldValues = FieldValues> = Omit<
  TextFieldProps,
  "name" | "required"
> & {
  name: Path<T>
  label?: string,
  readOnly?: boolean,
  placeholder?: string;
  onChange?: (content: string) => void,
  width?: string | number,
  height?: string | number,
  noImageUrl?: string,
};

const ImageUploadElement: React.FC<ImageUploadElementProps> = <TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  readOnly = false,
  placeholder,
  onChange,
  width = 200,
  height = 200,
  noImageUrl = NoImage,
  variant,
  className,
  helperText,
  ...props
}: ImageUploadElementProps<TFieldValues>): JSX.Element => {
  const { t } = useTranslation();
  const { setValue, getValues, register } = useFormContext();
  const initialValue = getValues(name);
  const [imgUrl, setImgUrl] = useState(initialValue || "");

  const handleUploadClick = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }
    var file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = function(e) {
      setImgUrl(reader.result as string);
    };
  };

  const handleClearLogoClick = () => {
    setValue(name, null as any, { shouldDirty: true });
    setImgUrl("");
  };

  return (
    <FormControl className="full-width" variant="outlined">
      <Stack spacing={1}>
        <FormLabel>{label}</FormLabel>
        <Paper sx={{ width: width, height: height }}>
          <img width={width} height={height} style={{ objectFit: "scale-down" }} src={imgUrl || noImageUrl} alt={name} />
        </Paper>
        <Stack direction="row">
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            sx={{ marginRight: "1rem" }}
            disabled={!imgUrl}
            onClick={e => handleClearLogoClick()}
          >
            {t("Remove")}
          </Button>
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            sx={{ marginRight: "1rem" }}
          >
            {t("Upload")}
            <input
              {...register(name, { required: false, onChange: (e) => handleUploadClick(e) })}
              type="file"
              name={name}
              hidden
              accept="image/jpeg,image/png,image/gif"
            />
          </Button>
        </Stack>
        <FormHelperText>{helperText}</FormHelperText>
      </Stack>
    </FormControl>
  );
};


export default ImageUploadElement;
