import { SxProps, useTheme } from "@mui/material";
import { scrollBarThumbBackgroundColor, scrollBarThumbBackgroundColorDarkMode, scrollBarTrackBackgroundColor, scrollBarTrackBackgroundColorDarkMode } from "theme/colors";

export function useScrollbarStyling() {
  const theme = useTheme();
  return {
    "&::-webkit-scrollbar": {
      width: "10px",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: theme.palette.mode === "dark" ? scrollBarTrackBackgroundColorDarkMode : scrollBarTrackBackgroundColor
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: theme.palette.mode === "dark" ? scrollBarThumbBackgroundColorDarkMode : scrollBarThumbBackgroundColor
    }
  } as SxProps
}