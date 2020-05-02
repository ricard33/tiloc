import { Model, fk, attr, many } from "redux-orm";
import * as types from "actions/actionTypes";

export const createModels = () => {
  const Owner = class OwnerModel extends Model {
    static modelName = "Owner";

    static get fields() {
      return {
        id: attr(),
        active: attr(),
        name: attr(),
        email: attr(),
        phone: attr(),
        contact: attr(),
        address: attr(),
        legal: attr(),
        payment: attr(),
        billing: attr(),
        no_vat: attr(),
        vat_rate: attr(),
        note: attr(),
        invoice_label: attr(),
        deposit_label: attr(),
        logo: attr(),
        signature: attr(),
        display_week: attr()
      };
    }

    static parse(data) {
      const { Owner } = this.session;
      return Owner.upsert(data);
    }

    static reducer(action, Owner, session) {
      switch (action.type) {
        case types.FETCH_OWNERS_SUCCESS: {
          action.data.results.forEach(item => Owner.parse(item));
          break;
        }
        default: {
        }
      }
    }
  }

  const Lodging = class LodgingModel extends Model {
    static modelName = "Lodging";

    static get fields() {
      return {
        id: attr(),
        active: attr(),
        name: attr(),
        owner: fk("Owner", "lodgings"),
        rank: attr(),
        address: attr(),
        default_price: attr(),
        guaranty: attr(),
        cleaning_fee: attr(),
        capacity: attr(),
        information: attr()
      };
    }

    static parse(data) {

      const { Lodging } = this.session;
      return Lodging.upsert({
        ...data
        // Not recursive, just an id
        // owner: Owner.parse(data.owner)
      });
    }

    static reducer(action, Lodging, session) {
      switch (action.type) {
        case types.FETCH_LODGINGS_SUCCESS: {
          action.data.results.forEach(item => Lodging.parse(item));
          break;
        }
        default: {
        }
      }
    }
  }

  const Category = class CategoryModel extends Model {
    static modelName = "Category";
  }

  const Service = class ServiceModel extends Model {
    static modelName = "Service";
  }

  const BookingStatus = class BookingStatusModel extends Model {
    static modelName = "BookingStatus";

    static get field() {
      return {
        id: attr(),
        name: attr(),
        color: attr(),
        rank: attr()
      };
    }

    static parse(data) {
      const { BookingStatus } = this.session;
      return BookingStatus.upsert(data);
    }

    static reducer(action, BookingStatus, session) {
      switch (action.type) {
        case types.FETCH_BOOKING_STATUSES_SUCCESS: {
          action.data.results.forEach(item => BookingStatus.parse(item));
          break;
        }
        default: {
        }
      }
    }
  }

  const BookingChannel = class BookingChannelModel extends Model {
    static modelName = "BookingChannel";

    static get field() {
      return {
        id: attr(),
        name: attr()
      };
    }

    static parse(data) {
      if (data) {
        const { BookingChannel } = this.session;
        return BookingChannel.upsert(data);
      }
    }
  }

  const Booking = class BookingModel extends Model {
    static modelName = "Booking";

    static get fields() {
      return {
        id: attr(),
        lodging: fk({
          to: "Lodging",
          as: "lodging",
          relatedName: "bookings"
        }),
        guest_name: attr(),
        guest_contact: attr(),
        status: fk({
          to: BookingStatus,
          as: "status"
        }),
        source: fk({
          to: BookingChannel,
          as: "source",
          relatedName: "bookings"
        }),
        begin_date: attr(),
        end_date: attr(),
        duration: attr(),
        adults: attr(),
        children: attr(),
        babies: attr(),
        catering: attr(),
        daily_rate: attr(),
        is_flat_rate: attr(),
        price: attr(),
        deposit: attr(),
        guaranty: attr(),
        info: attr(),
        contract: attr(),
        contract_date: attr(),
        special_conditions: attr(),
        options: many({
          to: Service,
          through: "BookedService"
        })
      };
    }

    static parse(data) {
      const { Lodging, BookingStatus, BookingChannel } = this.session;
      let { lodging, status, source, ...bookingProps } = data;
      bookingProps = {
        ...bookingProps,
        lodging: Lodging.parse(lodging),
        status: BookingStatus.parse(status),
        source: BookingChannel.parse(source)
      };
      return this.upsert(bookingProps);
    }

    static reducer(action, Booking, session) {
      switch (action.type) {
        case types.FETCH_BOOKINGS_SUCCESS: {
          action.data.results.forEach(item => Booking.parse(item));
          break;
        }
        default: {
        }
      }
    }
  }

  const BookedService = class BookedServiceModel extends Model {
    static modelName = "BookedService";

    static get field() {
      return {
        id: attr(),
        booking: fk("Booking"),
        service: fk("Service"),
        quantity: attr()
      };
    }

    static parse(data) {
      const { BookedService } = this.session;
      return BookedService.upsert(data);
    }
  }

  return {
    Owner, Lodging, Category, Service,
    BookingStatus, BookingChannel, Booking, BookedService
  };
};
