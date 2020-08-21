import { attr, fk, many, Model, oneToOne } from "redux-orm";
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
        case types.SUCCESS(types.FETCH_OWNERS): {
          action.data.results.forEach(item => Owner.parse(item));
          break;
        }
        default: {
        }
      }
    }
  };

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
        case types.SUCCESS(types.FETCH_LODGINGS): {
          action.data.results.forEach(item => Lodging.parse(item));
          break;
        }
        default: {
        }
      }
    }
  };

  const Category = class CategoryModel extends Model {
    static modelName = "Category";
  };

  const Service = class ServiceModel extends Model {
    static modelName = "Service";
  };

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
        case types.SUCCESS(types.FETCH_BOOKING_STATUSES): {
          action.data.results.forEach(item => BookingStatus.parse(item));
          break;
        }
        default: {
        }
      }
    }
  };

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

    static reducer(action, BookingChannel, session) {
      switch (action.type) {
        case types.SUCCESS(types.FETCH_BOOKING_CHANNELS): {
          action.data.results.forEach(item => BookingChannel.parse(item));
          break;
        }
        default: {
        }
      }
    }
  };

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
        lodging: lodging ? Lodging.parse(lodging) : null,
        status: BookingStatus.parse(status),
        source: source ? BookingChannel.parse(source) : null
      };
      return this.upsert(bookingProps);
    }

    static reducer(action, Booking, session) {
      switch (action.type) {
        case types.SUCCESS(types.FETCH_BOOKINGS): {
          action.data.results.forEach(item => Booking.parse(item));
          break;
        }
        case types.SUCCESS(types.CREATE_BOOKING):
        case types.SUCCESS(types.UPDATE_BOOKING): {
          // let booking = Booking.withId(action.data.id);
          // booking.update(action.data);
          Booking.parse(action.data);
          break;
        }
        case types.SUCCESS(types.DELETE_BOOKING): {
          console.debug("action", action);
          let booking = Booking.withId(action.id);
          booking.delete();
          break;
        }
        default: {
        }
      }
    }
  };

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
  };

  const ContractTemplate = class ContractTemplateModel extends Model {
    static modelName = "ContractTemplate";

    static get field() {
      return {
        id: attr(),
        name: attr(),
        content: attr(),
        created: attr(),
        modified: attr(),
      };
    }

    static parse(data) {
      const { ContractTemplate } = this.session;
      return ContractTemplate.upsert(data);
    }
  };

  const Contract = class ContractModel extends Model {
    static modelName = "Contract";

    static get fields() {
      return {
        id: attr(),
        booking: oneToOne({
          to: 'Booking',
          as: 'booking',
          relatedName: 'contract'
        }),
        content: attr(),
        pdf: attr(),
        created: attr(),
        modified: attr(),
        pdf_created: attr(),
        signed: attr(),
      };
    }

    static parse(data) {
      const { Contract } = this.session;
      return Contract.upsert(data);
    }

    static reducer(action, Contract, session) {
      switch (action.type) {
        case types.SUCCESS(types.FETCH_CONTRACTS): {
          action.data.results.forEach(item => Contract.parse(item));
          break;
        }
        case types.SUCCESS(types.UPDATE_CONTRACT):
        case types.SUCCESS(types.GET_OR_CREATE_CONTRACT):
        case types.SUCCESS(types.GENERATE_CONTRACT): {
          Contract.parse(action.data);
          break;
        }
        case types.SUCCESS(types.DELETE_CONTRACT): {
          let contract = Contract.withId(action.id);
          contract.delete();
          break;
        }
        default: {
        }
      }
    }

  };

  return {
    Owner, Lodging, Category, Service,
    BookingStatus, BookingChannel, Booking, BookedService,
    Contract, ContractTemplate,
  };
};
