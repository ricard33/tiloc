import React, { useState } from "react";
import { makeStyles } from "@mui/styles";
import { IconButton, InputAdornment, TextField, Theme } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import clsx from "clsx";


const useStyles = makeStyles((theme: Theme) => ({
  root: {
    // borderRadius: "4px",
    // alignItems: "center",
    // padding: theme.spacing(1),
    // display: "flex",
    // flexBasis: 420,
    // flexGrow: 1,
    minWidth: "250px"
  },
}));

type Props = {
  className?: string,
  onChange: (text: string) => void,
  placeholder?: string,
  style?: object

};

const SearchInput: React.FC<Props> = props => {
  const { className, onChange, style, placeholder } = props;
  const [value, setValue] = useState("");
  const classes = useStyles();

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
      className={clsx(classes.root, className)}
      style={style}
      placeholder={placeholder}
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
