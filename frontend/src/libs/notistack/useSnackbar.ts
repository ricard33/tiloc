import { useContext } from 'react';
import SnackbarContext from './SnackbarContext';
import { ProviderContext } from '.';

const useSnackbar = (): ProviderContext => useContext(SnackbarContext);
export default useSnackbar;
