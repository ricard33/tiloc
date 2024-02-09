import React, { useState } from "react";
import { IconButton, InputAdornment, TextField, TextFieldProps } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";


type Props = Omit<TextFieldProps, "onChange"> & {
  onChange: (text: string) => void,
};

const SearchInput: React.FC<Props> = props => {
  const { onChange, style, placeholder, ...rest} = props;
  const [value, setValue] = useState("");

  const handleOnChange = (newValue: string) => {
    setValue(newValue);
    onChange(newValue);
  };

  const handleClickClearSearch = () => {
    setValue("");
    onChange("");
  };

  const handleMouseDownClearSearch = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <TextField
      id="input-with-icon-textfield"
      {...rest}
      style={{ minWidth: "250px", ...style }}
      value={value}
      onChange={event => handleOnChange(event.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
        ...(value ? {endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="clear search"
              onClick={handleClickClearSearch}
              onMouseDown={handleMouseDownClearSearch}
              edge="end"
            >
              <CloseIcon />
            </IconButton>
          </InputAdornment>
        )} : {}),
      }}
      variant="standard"
    />
  );
};

export default SearchInput;
