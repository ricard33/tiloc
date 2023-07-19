import { api, serviceURL } from "./api";
import { vi } from 'vitest';
import axios, { AxiosRequestConfig } from "axios";
import { setupApiStore } from "../common/testUtils2";
import { auth as authReducer } from "../reducers";
import { newPayment, payment, paymentREST, paymentsList } from "./testData";
import { payment2Api } from "../types/models-convertion";

// beforeEach((): void => {
//   fetchMock.resetMocks();
// });
vi.mock("axios");
// const axiosMock = axios as jest.Mocked<typeof axios>;

describe("List Payment", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  test("request is correct", () => {
    const storeRef = setupApiStore(api, { auth: authReducer });
    // @ts-ignore
    axios.mockResolvedValue({ data: paymentsList, status: 200 });

    return storeRef.store
      .dispatch<any>(
        api.endpoints.listPayments.initiate({})
      )
      .then(() => {
        expect(axios).toBeCalledTimes(1);
        // @ts-ignore
        const { method, url } = axios.mock.calls[0][0] as AxiosRequestConfig;

        expect(method).toBe("GET");
        expect(url).toBe(`${serviceURL}payment/`);
      });
  });
  test("successful response", () => {
    const storeRef = setupApiStore(api, { auth: authReducer });
    // @ts-ignore
    axios.mockResolvedValue({ data: paymentsList, status: 200 });

    return storeRef.store
      .dispatch<any>(
        api.endpoints.listPayments.initiate({})
      )
      .then((action: any) => {
        console.log(action);
        const { status, data, isSuccess } = action;
        expect(status).toBe("fulfilled");
        expect(isSuccess).toBe(true);
        expect(data).toStrictEqual([payment]);
      });
  });
  test("unsuccessful response", () => {
    const storeRef = setupApiStore(api, { auth: authReducer });
    // @ts-ignore
    axios.mockRejectedValue({ response: { status: 400, statusText: "Internal Server Error" } });

    return storeRef.store
      .dispatch<any>(
        api.endpoints.listPayments.initiate({})
      )
      .then((action: any) => {
        const { status, error, isError } = action;
        expect(status).toBe("rejected");
        expect(isError).toBe(true);
        expect(error.status).toBe(400);
        expect(error.message).toBe("Internal Server Error");
      });
  });
});

describe("Create Payment", () => {
  test("request is correct", () => {
    const storeRef = setupApiStore(api, { auth: authReducer });
    // @ts-ignore
    axios.mockResolvedValue({ data: paymentREST, status: 201 });
    return storeRef.store
      .dispatch<any>(api.endpoints.createPayment.initiate(newPayment))
      .then(() => {
        expect(axios).toBeCalledTimes(1);
        // @ts-ignore
        const request = axios.mock.calls[0][0] as AxiosRequestConfig;
        const { method, url, data } = request;
        console.log(request);

        expect(data).toStrictEqual(payment2Api(newPayment));

        expect(method).toBe("POST");
        expect(url).toBe(`${serviceURL}payment/`);
      });
  });
  test("successful response", () => {
    const storeRef = setupApiStore(api, { auth: authReducer });
    // @ts-ignore
    axios.mockResolvedValue({ data: paymentREST, status: 200 });

    return storeRef.store
      .dispatch<any>(api.endpoints.createPayment.initiate(newPayment))
      .then((action: any) => {
        const { data } = action;
        expect(data).toStrictEqual(payment);
      });
  });
  test("unsuccessful response", () => {
    const storeRef = setupApiStore(api, { auth: authReducer });
    // @ts-ignore
    axios.mockRejectedValue({ response: { status: 400, statusText: "Internal Server Error" } });

    return storeRef.store
      .dispatch<any>(
        api.endpoints.createPayment.initiate(newPayment)
      )
      .then((action: any) => {
        const { error } = action;
        expect(error.status).toBe(400);
        expect(error.message).toBe("Internal Server Error");
      });
  });
});
