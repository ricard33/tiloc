import React from "react";
import { Provider } from "react-redux";
import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import BookingList from "./BookingList";
import axios from "axios";
// import { createMount } from "@material-ui/core/test-utils";
import { ThemeProvider } from "@material-ui/core/styles";
import theme from "theme";
import {mount, shallow} from "enzyme";
import { createTestSessionWithData } from "../../common/testUtils";

jest.mock("axios");

function getMockedBookings() {
  return [{ id: 1, guest_name: "Bob", lodging: {name: "Lovely Studio"}, status: {name: "Option"}, price: 100 }];
}

describe("BookingList component", () => {
  // let mount;

  // beforeAll(() => {
  //   mount = createMount();
  // });
  //
  // afterAll(() => {
  //   mount.cleanUp();
  // });

  test.skip("simple instantiation", () => {
    const mocked_bookings = getMockedBookings();
    const resp = { data: { results: mocked_bookings, count:1 } };
    axios.get.mockResolvedValue(resp);
    const {session, orm, ormState} = createTestSessionWithData();
    const mockStore = configureMockStore();
    const store = mockStore({
      entities: ormState,
      // bookings: {loading: false, results: mocked_bookings, count:1},
      fetching: {bookings: { loading: false }}
    });

    const wrapper = mount(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <BookingList/>
        </ThemeProvider>
      </Provider>
    );
    // wrapper.update();
    // expect(wrapper.find("BookingTable").length).toEqual(1);
    expect(wrapper.html()).toContain("Guest 1");
  });
});
