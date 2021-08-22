import palette from '../palette';
import typography from '../typography';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  root: {
    ...typography.body1,
    borderBottom: `1px solid ${palette.divider}`
  }
};
