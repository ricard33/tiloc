import { ORM } from "redux-orm";
import { createModels } from "../models";

const stateSelector = store => store;

export const createTestORM =  () => {
  const models = createModels();
  const {
    Owner, Lodging, Category, Service,
    BookingStatus, BookingChannel, Booking, BookedService
  } = models;
  const orm = new ORM({ stateSelector });
  orm.register(Owner, Lodging, Category, Service,
    BookingStatus, BookingChannel, Booking, BookedService);
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
  let lodging = session.Lodging.create({
    id: 1,
    name: "Lovely place",
    owner: session.Owner.create({
      id: 1,
      name: "John DOE"
    })
  });
  session.Booking.create({
    id: 1,
    lodging: lodging,
    guest_name: "Guest 1",
    guest_contact: "+12345",
    guest_address: "Road 66, LA"
  });
  session.Booking.create({
    id: 2,
    lodging: lodging,
    guest_name: "Guest 2",
    guest_contact: "+54321",
    guest_address: "Fort-de-France, Martinique"
  });
  return session.state;
};
