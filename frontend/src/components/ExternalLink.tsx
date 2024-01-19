import * as React from "react";
import { PropsWithChildren } from "react";
import { Link, LinkProps } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

type Props = LinkProps & {
  label: string;
};

export default function ExternalLink(props: PropsWithChildren<Props>) {
  const {
    label,
    href,
    ...rest
  } = props;
  return (
    <Link
      href={href}
      target="_blank" sx={{ display: "flex", alignItems: "center" }}
      {...rest}
    ><span>{label}</span><OpenInNewIcon fontSize="small" sx={{ marginLeft: "4px" }} /></Link>
  );
}
