import { AlertColor } from '@mui/material/Alert';

export interface IError {
  message: string,
}

// Keep empty for now until we decide how to do error handling in future
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IApiError extends IError {}

export interface IUserError extends IError {
  severity: AlertColor
}
