import PropTypes from "prop-types";

export function isoDateValidation() {
  return function(props, propName, componentName) {
    if (props[propName] && !/\d{4}-\d{2}-\d{2}/.test(props[propName])) {
      return new Error(
        "Invalid prop `" + propName + "` supplied to" +
        " `" + componentName + "`. Expected ISO date format (YYYY-MM-DD). Validation failed."
      );
    }
  };
}

export const bookingType = PropTypes.shape({
  id: PropTypes.number,
  lodging_id: PropTypes.number,
  guest_name: PropTypes.string,
  guest_contact: PropTypes.string,
  status_id: PropTypes.number,
  source_id: PropTypes.number,
  begin_date: isoDateValidation(),
  end_date: isoDateValidation(),
  duration: PropTypes.number,
  adults: PropTypes.number,
  children: PropTypes.number,
  babies: PropTypes.number,
  catering: PropTypes.string,
  daily_rate: PropTypes.number,
  is_flat_rate: PropTypes.bool,
  price: PropTypes.number,
  deposit: PropTypes.number,
  guaranty: PropTypes.number,
  contract: PropTypes.string,
  contract_date: isoDateValidation(),
  notes: PropTypes.string,
  options: PropTypes.array,
});
