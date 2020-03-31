import { combineReducers } from 'redux';

import alert from './alert';
import auth from './auth';
import bookings from './bookings';

export default combineReducers({
  alert,
  auth,
  bookings,
});
