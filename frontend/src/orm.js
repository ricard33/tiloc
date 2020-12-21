import { ORM } from "redux-orm";
import { createModels } from "./models";

const orm = new ORM({
  stateSelector: state => state.entities
});
const { Owner, Lodging, Category, Service,
  BookingStatus, BookingChannel, Booking, Contract, ContractTemplate
} = createModels();
orm.register(Owner, Lodging, Category, Service,
  BookingStatus, BookingChannel, Booking, Contract, ContractTemplate);

export default orm;
