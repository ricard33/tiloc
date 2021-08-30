
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

export function apiErrorDecode(error: (FetchError | ServerError)): string {
  if ((error as FetchError).error) return (error as FetchError).error;
  if ((error as ServerError).data) {
    const serverError = (error as ServerError);
    const apiError = serverError.data as ApiError;
    if (apiError.detail) return apiError.detail;

    const validationError = serverError.data as ValidationError;
    return JSON.stringify(validationError);
  }

  console.warn("Can't decode error object: ", JSON.stringify(error));
  return "UNKNOWN ERROR";
}
