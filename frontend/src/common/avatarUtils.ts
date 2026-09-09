import { getGravatarUrl } from "../components/Gravatar";
import { User } from "../types";

export function stringToColor(string: string) {
  let hash = 0;
  let i;

   
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "";

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
   

  return color;
}

export function stringAvatar(user: Pick<User, "full_name" | "email">) {
  const defaultImageUrl =
    user.full_name
      ? `https://ui-avatars.com/api/${user.full_name.replaceAll(" ", "+")}/80/${stringToColor(user.full_name)}/ffffff`
      : undefined
  ;

  return {
    src: getGravatarUrl(user.email, {
      default: "mp",
      defaultUrl: defaultImageUrl
    }),
    sx: {
      bgcolor: stringToColor(user.full_name)
    }
  };
}
