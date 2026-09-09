import React, { useState } from "react";
import { Path, useFormContext } from "react-hook-form";
import { FieldValues } from "react-hook-form/dist/types/fields";
import { useTranslation } from "react-i18next";
import { Button, FormControl, FormHelperText, FormLabel, Paper, Stack, TextFieldProps } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import NoImage from "../../assets/images/no-image.png";
import CropImageDialog from "../CropImageDialog";
import Resizer from "react-image-file-resizer";


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
  withCrop?: boolean,
  resizeImage?: { maxWidth: number, maxHeight: number },
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
  withCrop,
  resizeImage,
  variant,
  className,
  helperText,
  ...props
}: ImageUploadElementProps<TFieldValues>): JSX.Element => {
  const { t } = useTranslation();
  const { setValue, getValues, register } = useFormContext();
  const initialValue = getValues(name);
  const [imgToCrop, setImgToCrop] = useState("");
  const [imgSrc, setImgSrc] = useState(initialValue || "");
  const [fileInfo, setFileInfo] = useState<{ name: string, type: string, lastModified: number }>();

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileInfo({ name: file.name, type: file.type, lastModified: file.lastModified });
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        if (withCrop)
          setImgToCrop(reader.result?.toString() || "");
        else
          setImgSrc(reader.result?.toString() || "");
      });
      reader.readAsDataURL(file);
    }
  }

  const handleClearLogoClick = () => {
    setValue(name, null as any, { shouldDirty: true });
    setImgSrc("");
    setValue(name, "" as any);
  };

  const resizeFile = (file: Blob, maxWidth: number, maxHeight: number) =>
    new Promise<Blob>((resolve) => {
      Resizer.imageFileResizer(
        file,
        maxWidth,
        maxHeight,
        "JPEG",
        90,
        0,
        (uri) => {
          resolve(uri as Blob);
        },
        "blob"
      );
    });

  const handleOnCrop = async (croppedImageUrl: string) => {
    console.log("croppedImageUrl", croppedImageUrl);
    setImgSrc(croppedImageUrl);
    setImgToCrop("");
    const blob = await fetch(croppedImageUrl).then(r => r.blob());
    const resizedBlob = resizeImage ? await resizeFile(blob, resizeImage.maxWidth, resizeImage.maxHeight) : blob;
    const dataTransfer = new DataTransfer();
    const file = new File([resizedBlob], fileInfo!.name /*{type: fileInfo!.type, lastModified: fileInfo!.lastModified}*/);
    dataTransfer.items.add(file);
    setValue(name, dataTransfer.files as any, { shouldDirty: true });
  };

  return (
    <FormControl className="full-width" variant="outlined">
      <Stack spacing={1}>
        <FormLabel>{label}</FormLabel>
        <Paper sx={{ width: width, height: height }}>
          <img
            width={width} height={height} style={{ objectFit: "scale-down" }}
            src={imgSrc || noImageUrl} alt={name}
          />
        </Paper>
        <Stack direction="row">
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            sx={{ marginRight: "1rem" }}
            disabled={!imgSrc}
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
              {...register(name, { required: false, onChange: (e) => onSelectFile(e) })}
              type="file"
              name={name}
              hidden
              accept="image/jpeg,image/png,image/gif"
            />
          </Button>
        </Stack>
        <FormHelperText>{helperText}</FormHelperText>
      </Stack>
      {imgToCrop &&
        <CropImageDialog
          imgSrc={imgToCrop}
          onCancel={() => setImgToCrop("")}
          onCrop={handleOnCrop}
        />}
    </FormControl>
  );
};


export default ImageUploadElement;
