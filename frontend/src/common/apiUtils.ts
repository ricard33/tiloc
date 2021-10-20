import { ApiError, QueryError, ValidationError } from "../services/api";


export function apiErrorDecode(error: (ApiError | ValidationError)): string {
  const apiError = error as ApiError;
  if (apiError.detail) return apiError.detail;

  const validationError = error as ValidationError;
  return JSON.stringify(validationError);
}

export function fetchErrorDecode(error: QueryError): string {
  if (error.data){
    return apiErrorDecode(error.data);
  }

  console.warn("Can't decode error object: ", JSON.stringify(error));
  return "UNKNOWN ERROR";
}
