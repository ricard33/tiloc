import { ORM } from "redux-orm";
import {
  Owner, Lodging, Category, Service,
  BookingStatus, BookingChannel, Booking, BookedService
} from "./models";

const orm = new ORM({
  stateSelector: state => state.entities
});
orm.register(Owner, Lodging, Category, Service,
  BookingStatus, BookingChannel, Booking, BookedService);

export default orm;
