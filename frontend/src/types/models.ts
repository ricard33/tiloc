import axios from "axios";

export interface Pagination<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export function makeApi<TApi, TModel>(baseUrl: string, fromApi: (obj: TApi) => TModel, toApi: (obj: TModel) => TApi) {
  const get = (id: number) => {
    return axios.get<TApi>(`${baseUrl}/${id}/`)
      .then(response => {
        return fromApi(response.data);
      });
  };

  const getList = () => {
    return axios.get<Pagination<TApi>>(`${baseUrl}/`)
      .then(response => {
        return {
          ...response.data,
          results: response.data.results.map(fromApi)
        };
      });
  };

  const create = (obj: TModel) => {
    return axios.post<TApi>(`${baseUrl}/`, toApi(obj))
      .then(response => {
        return fromApi(response.data);
      });
  };

  const deleteFnct = (id: number) => {
    return axios.delete(`${baseUrl}/${id}/`);
  };


  return { getList, get, create, delete: deleteFnct };
}

