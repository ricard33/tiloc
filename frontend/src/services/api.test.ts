import { api, serviceURL } from './api';
import fetchMock from 'jest-fetch-mock';
import { setupApiStore } from "../common/testUtils2";
import { auth as authReducer } from '../reducers';
import { Headers } from '../types';
import { newPayment, payment, paymentsList } from "./testData";

beforeEach((): void => {
  fetchMock.resetMocks();
});

describe("List Payments", () => {

  test("request is correct", () => {
    const storeRef = setupApiStore(api, { auth: authReducer });
    fetchMock.mockResponse(JSON.stringify(paymentsList));

    return storeRef.store
      .dispatch<any>(
        api.endpoints.listPayments.initiate(undefined)
      )
      .then(() => {
        expect(fetchMock).toBeCalledTimes(1);
        const { method, headers, url } = fetchMock.mock.calls[0][0] as Request;

        const accept = headers.get(Headers.Accept);
        const authorization = headers.get(Headers.Authorization);

        expect(method).toBe("GET");
        expect(url).toBe(`${serviceURL}payment/`);
        expect(accept).toBe("application/json");
        expect(authorization).toBeNull();
      });
  });
  test("successful response", () => {
    const storeRef = setupApiStore(api, { auth: authReducer });
    fetchMock.mockResponse(JSON.stringify(paymentsList));

    return storeRef.store
      .dispatch<any>(
        api.endpoints.listPayments.initiate(undefined)
      )
      .then((action: any) => {
        const { status, data, isSuccess } = action;
        expect(status).toBe("fulfilled");
        expect(isSuccess).toBe(true);
        expect(data).toStrictEqual(paymentsList);
      });
  });
  test("unsuccessful response", () => {
    const storeRef = setupApiStore(api, { auth: authReducer });
    fetchMock.mockReject(new Error("Internal Server Error"));

    return storeRef.store
      .dispatch<any>(
        api.endpoints.listPayments.initiate(undefined)
      )
      .then((action: any) => {
        const {
          status,
          error: { error },
          isError,
        } = action;
        expect(status).toBe("rejected");
        expect(isError).toBe(true);
        expect(error).toBe("Error: Internal Server Error");
      });
  });
});

describe("Create Payment", () => {
  test("request is correct", () => {
    const storeRef = setupApiStore(api, { auth: authReducer });
    fetchMock.mockResponse(JSON.stringify(payment));
    return storeRef.store
      .dispatch<any>(api.endpoints.createPayment.initiate(newPayment))
      .then(() => {
        expect(fetchMock).toBeCalledTimes(1);
        const request = fetchMock.mock.calls[0][0] as Request;
        const { method, headers, url } = request;

        void request.json().then((data) => {
          expect(data).toStrictEqual(newPayment);
        });

        const accept = headers.get(Headers.Accept);

        expect(method).toBe("POST");
        expect(url).toBe(`${serviceURL}payment/`);
        expect(accept).toBe("application/json");
      });
  });
  test("successful response", () => {
    const storeRef = setupApiStore(api, { auth: authReducer });
    fetchMock.mockResponse(JSON.stringify(payment));

    return storeRef.store
      .dispatch<any>(api.endpoints.createPayment.initiate(newPayment))
      .then((action: any) => {
        const { data } = action;
        expect(data).toStrictEqual(payment);
      });
  });
  test("unsuccessful response", () => {
    const storeRef = setupApiStore(api, { auth: authReducer });
    fetchMock.mockReject(new Error("Internal Server Error"));

    return storeRef.store
      .dispatch<any>(
        api.endpoints.createPayment.initiate(newPayment)
      )
      .then((action: any) => {
        const {
          status,
          error: { error },
          isError,
        } = action;
        // expect(status).toBe("rejected");
        // expect(isError).toBe(true);
        expect(error).toBe("Error: Internal Server Error");
      });
  });
});
