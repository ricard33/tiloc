import palette from '../palette';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  root: {
    '&$selected': {
      backgroundColor: palette.background.default
    },
    '&$hover': {
      '&:hover': {
        backgroundColor: palette.background.default
      }
    }
  }
};
