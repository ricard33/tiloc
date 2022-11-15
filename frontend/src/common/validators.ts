const checked = (value: boolean, options: { message: any; }) => {
  if (value !== true) {
    return options.message || 'must be checked';
  }
};

const validators = {
  checked
};

export default validators;
