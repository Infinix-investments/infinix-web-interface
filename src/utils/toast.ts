import { toast, ToastOptions } from 'react-toastify';

const baseOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'dark',
};

export const showSuccessToast = (message: string, options?: ToastOptions) => {
  return toast.success(message, {
    ...baseOptions,
    ...options,
    className: 'infinix-toast infinix-toast-success',
  });
};

export const showErrorToast = (message: string, options?: ToastOptions) => {
  return toast.error(message, {
    ...baseOptions,
    ...options,
    className: 'infinix-toast infinix-toast-error',
  });
};

export const showInfoToast = (message: string, options?: ToastOptions) => {
  return toast.info(message, {
    ...baseOptions,
    ...options,
    className: 'infinix-toast infinix-toast-info',
  });
};

export const showWarningToast = (message: string, options?: ToastOptions) => {
  return toast.warning(message, {
    ...baseOptions,
    ...options,
    className: 'infinix-toast infinix-toast-warning',
  });
};

export const showGoldToast = (message: string, options?: ToastOptions) => {
  return toast(message, {
    ...baseOptions,
    ...options,
    className: 'infinix-toast infinix-toast-gold',
  });
};

export { toast };
