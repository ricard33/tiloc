import React from 'react';
import { DialogProps, ButtonProps } from '@mui/material';

export interface ConfirmOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  content?: React.ReactNode | null;
  confirmationText?: React.ReactNode;
  cancellationText?: React.ReactNode;
  dialogProps?: Omit<DialogProps, "open">;
  confirmationButtonProps?: ButtonProps;
  cancellationButtonProps?: ButtonProps;
}

export interface ConfirmProviderProps {
  children: React.ReactNode;
  defaultOptions?: ConfirmOptions;
}

export const ConfirmProvider: React.ComponentType<ConfirmProviderProps>;

export const useConfirm: () => (options?: ConfirmOptions) => Promise<void>;
