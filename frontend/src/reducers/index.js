import { combineReducers } from 'redux';

import alert from './alert';
import bookings from './bookings';

export default combineReducers({
  alert,
  bookings,
});
