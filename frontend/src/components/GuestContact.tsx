import * as React from "react";
import PhoneOrEmail from "./PhoneOrEmail";


type Props = {
  value?: string;
};

export default function GuestContact(props: Props) {
  const {
    value
  } = props;

  if (!value) return <></>;

  return <>
    {value.match(/[^\r\n]+/g)!.map((s, index) => (
      <div key={index}><PhoneOrEmail value={s} /></div>
    ))}
  </>;
}
