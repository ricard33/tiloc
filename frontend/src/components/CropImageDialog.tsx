import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  Slider,
  Stack,
  Typography
} from "@mui/material";
import { centerCrop, convertToPixelCrop, Crop, makeAspectCrop, PixelCrop, ReactCrop } from "react-image-crop";
import { imgPreview } from "../common/imgPreview";
import "react-image-crop/dist/ReactCrop.css";
import Grid2 from "@mui/material/Unstable_Grid2";
import CropIcon from "@mui/icons-material/Crop";

// This is to demonstrate how to make and center a % aspect crop
// which is a bit trickier, so we use some helper functions.
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}


type Props = Omit<DialogProps, "open"> & {
  imgSrc: string;
  onCancel: () => void;
  onCrop: (imageData: string) => void;
  defaultAspectRation?: number;
};

const CropImageDialog: React.FunctionComponent<Props> = ({
  imgSrc,
  onCancel,
  onCrop,
  defaultAspectRation,
  ...dialogProps
}: Props) => {
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(defaultAspectRation);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    if (aspect) {
      setCrop(centerAspectCrop(width, height, aspect));
    } else
      setCrop({
        unit: "%", // Can be 'px' or '%'
        x: 5,
        y: 5,
        width: 90,
        height: 90
      });
  }

  async function handleCropButton() {
    console.log("handleCropButton", completedCrop);
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      console.log("imgPreview");
      const croppedImgSrc = await imgPreview(
        imgRef.current,
        completedCrop,
        scale,
        rotation
      );
      console.log("onCrop");
      onCrop(croppedImgSrc);
    }
  }

  function handleSetAspectClick(ratio?: number) {
    setAspect(ratio);

    if (ratio) {
      if (imgRef.current) {
        const { width, height } = imgRef.current;
        const newCrop = centerAspectCrop(width, height, ratio);
        setCrop(newCrop);
        // Updates the preview
        setCompletedCrop(convertToPixelCrop(newCrop, width, height));
      }
    }
  }

  return (
    <Dialog open={!!imgSrc} onClose={onCancel} aria-labelledby="form-dialog-title" maxWidth="md" {...dialogProps}>
      <DialogTitle id="form-dialog-title">{t("Crop uploaded image")}</DialogTitle>
      <DialogContent>
        <Grid2 container spacing={2}>
          <Grid2 sm={6} xs={12}>
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              minWidth={100}
              minHeight={100}
              // circularCrop
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imgSrc}
                style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </Grid2>
          <Grid2 sm={6} xs={12}>
            <Stack>
              <Stack direction="row">
                <Typography variant="overline" sx={{ alignSelf: "center" }}>
                  {t("Zoom")}
                </Typography>
                <Slider
                  value={scale}
                  min={0.5} max={3} step={0.1}
                  aria-labelledby="Zoom"
                  sx={{
                    padding: "22px 0px",
                    marginLeft: "16px"
                  }}
                  disabled={!imgSrc}
                  onChange={(_, zoom) => setScale(zoom as number)}
                />
              </Stack>
              <Stack direction="row">
                <Typography variant="overline" sx={{ alignSelf: "center" }}>
                  {t("Rotation")}
                </Typography>
                <Slider
                  value={rotation}
                  min={0} max={360} step={1}
                  aria-labelledby="Rotation"
                  sx={{
                    padding: "22px 0px",
                    marginLeft: "16px"
                  }}
                  disabled={!imgSrc}
                  onChange={(_, rotate) => setRotation(rotate as number)}
                />
              </Stack>
              <Stack direction={"row"} spacing={1}>
                <Typography variant="overline" sx={{ alignSelf: "center", textWrap: "nowrap"}}>
                  {t("Aspect ratio")}
                </Typography>
                <Stack direction={"row"} spacing={1} useFlexGap flexWrap="wrap">
                  <Button onClick={() => handleSetAspectClick()} variant="contained" size="small">
                    {t("Free")}
                  </Button>
                  <Button onClick={() => handleSetAspectClick(16 / 9)} variant="contained" size="small">
                    16/9
                  </Button>
                  <Button onClick={() => handleSetAspectClick(4 / 3)} variant="contained" size="small">
                    4/3
                  </Button>
                  <Button onClick={() => handleSetAspectClick(1)} variant="contained" size="small">
                    {t("Square")}
                  </Button>

                </Stack>
              </Stack>

            </Stack>
          </Grid2>
        </Grid2>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="secondary">
          {t("Cancel")}
        </Button>
        <Button onClick={() => handleCropButton()} color="primary" startIcon={<CropIcon />}>
          {t("Crop")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CropImageDialog;

