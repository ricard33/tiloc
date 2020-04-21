import { combineReducers } from 'redux';

import alert from './alert';
import auth from './auth';
import bookings from './bookings';
import bookingStatuses from './booking_statuses';

export default combineReducers({
  alert,
  auth,
  bookings,
  bookingStatuses,
});
