import * as React from "react";
import reactStringReplace from "../common/reactStringReplace";
import IconButton from "@mui/material/IconButton";
import FontAwesomeSvgIcon from "./FontAwesomeSvgIcon";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons/faWhatsapp";
import { green } from "@mui/material/colors";


type Props = {
  value: string;
};

export default function PhoneOrEmail(props: Props) {
  const {
    value
  } = props;
  const whatsAppPhoneNumber = (phone: string): string => {
    return phone.replace(/^00/, "")
      .replace(/^0696/, "596696")
      .replace(/^0596/, "596696")
      .replace(/^00/, "")
      .replace(/^0/, "33")
      .replace("+", "")
      .replaceAll(" ", "");
  };

  let result = reactStringReplace(value, /([\w._-]+@[\w.-]+\.[\w-]+)/g, (email, i) => (
    <a key={i} href={"mailto:" + email}>
      {email}
    </a>
  ));
  result = reactStringReplace(
    result,
    /([+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[0-9][-\s./0-9]{6,12}[0-9])/g,
    (phone, i) => (
      <span key={i}>
        <a href={"tel:" + phone}>{phone}</a>
        <a href={"https://wa.me/" + whatsAppPhoneNumber(phone)} target="_blank" rel="noreferrer">
          <IconButton aria-label="WhatsApp">
            <FontAwesomeSvgIcon icon={faWhatsapp} sx={{ color: green[500] }} />
          </IconButton>
        </a>
      </span>
    )
  );
  return <>
    {result}
  </>;
}
