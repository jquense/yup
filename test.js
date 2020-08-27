const yup = require('./lib/index');
const schema = yup.object().shape({
  untilDate: yup
    .date()
    .min('01-01-2020')
    .test('format', '${path} must match the mm-dd-yyyy format', function (
      value) {
      debugger;
    }),
});

schema.isValid({
  untilDate: new Date(),
});
