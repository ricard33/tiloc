import { ORM } from "redux-orm";
import { createModels } from "../models-orm";

const stateSelector = store => store;

export const createTestORM =  () => {
  const models = createModels();
  const {
    Owner, Lodging, Category, Service,
    BookingStatus, BookingChannel, Booking, Contract, ContractTemplate
  } = models;
  const orm = new ORM({ stateSelector });
  orm.register(Owner, Lodging, Category, Service,
    BookingStatus, BookingChannel, Booking, Contract, ContractTemplate);
  return orm;
};

export function createTestSession() {
  const orm = createTestORM();
  return orm.session(orm.getEmptyState());
}

export function createTestSessionWithData(customORM) {
  const orm = customORM || createTestORM();
  const state = orm.getEmptyState();
  populateOrmStore(orm.mutableSession(state));

  const normalSession = orm.session(state);
  return { session: normalSession, orm, state };
}

export const populateOrmStore = (session) => {
  const owner = session.Owner.create({
    id: 1,
    name: "John DOE"
  });
  let lodging = session.Lodging.create({
    id: 1,
    name: "Lovely place",
    owner: owner
  });
  let lodging2 = session.Lodging.create({
    id: 2,
    name: "Paradise",
    owner: owner
  });
  session.Booking.create({
    id: 1,
    lodging: lodging,
    guest_name: "Guest 1",
    guest_contact: "+12345",
    guest_address: "Road 66, LA",
    begin_date: "2020-02-01",
    end_date: "2020-02-17",
  });
  let booking2 = session.Booking.create({
    id: 2,
    lodging: lodging,
    guest_name: "Guest 2",
    guest_contact: "+54321",
    guest_address: "Fort-de-France, Martinique",
    begin_date: "2020-02-27",
    end_date: "2020-03-14",
  });
  session.Contract.create({
    id: 1,
    booking: booking2,
    content: "Contract for Guest 2",
  })

  session.Booking.create({
    id: 3,
    lodging: lodging2,
    guest_name: "Guest 3",
    guest_contact: "+1234500",
    guest_address: "Baker street, London",
    begin_date: "2020-02-08",
    end_date: "2020-02-22",
  });
  return session.state;
};
