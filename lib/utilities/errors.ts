import { AlertColor } from '@mui/material/Alert';

export interface IError {
  message: string,
}

export interface IApiError extends IError {}

export interface IUserError extends IError {
  severity: AlertColor
}
