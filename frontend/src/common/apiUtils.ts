
type FetchError = {
  error: string;
  status: string;
}

interface ApiError {
  detail: string;
}

interface ValidationError {
  [field: string]: string[];
}

interface ServerError {
  data: ApiError | ValidationError;
  status: number;
}

export function apiErrorDecode(error: (ApiError | ValidationError)): string {
  const apiError = error as ApiError;
  if (apiError.detail) return apiError.detail;

  const validationError = error as ValidationError;
  return JSON.stringify(validationError);
}

export function fetchErrorDecode(error: (FetchError | ServerError)): string {
  if ((error as FetchError).error) return (error as FetchError).error;
  if ((error as ServerError).data) {
    const serverError = (error as ServerError);
    return apiErrorDecode(serverError.data);
  }

  console.warn("Can't decode error object: ", JSON.stringify(error));
  return "UNKNOWN ERROR";
}
