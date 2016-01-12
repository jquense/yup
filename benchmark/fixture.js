var yup = require('../lib')
var object = yup.object
  , array = yup.array
  , string = yup.string
  , bool = yup.bool
  , number = yup.number
  , mixed = yup.mixed
  , date = yup.date


var AttributeDatatype = {
  Number: 1,
  Phone: 2,
  Email: 3,
  Date: 4,
  Text: 5,
  Address: 6,
  YesNo: 7,
  TextArea: 8,
  GPS: 9,
  CustomValue: 10,
  Ages: 11,
  BirthYear: 12,
  DateOfBirth: 13
};

var attributeValue = mixed()
  .when('dataType', (dataType) => {
    var newSchema;

    switch (dataType) {
      case AttributeDatatype.Email:
        newSchema = string().email('baf');
        break;
      case AttributeDatatype.Date:
      case AttributeDatatype.DateOfBirth:
        newSchema = date();
        break;
      case AttributeDatatype.Number:
      case AttributeDatatype.BirthYear:
        newSchema = number().typeError('baf');
        break;
      case AttributeDatatype.YesNo:
        newSchema = bool().default(false);
        break;
      default:
        newSchema = string();
    }

    return newSchema.nullable()
  });

var values = Object.keys(AttributeDatatype).map(function(k) { return AttributeDatatype[k] })

var ChildAttribute = object({
  objectAttrID: number(),
  attributeID:  number(),
  attribute:    string(),

  value: attributeValue,

  text: string(),

  dataType: number()
    .oneOf(values),

  seqID: number()

}).camelcase()

var schema = object({

  objectAttrID: number(),
  attributeID:  number(),
  contactID:    number(),
  eventID:      number(),
  docID:        number(),

  attribute: string(),
  isActive:  bool(),
  seqID: number(),
  historyID: number(),
  orgnID: number(),
  workflowID: number(),
  caseStatusID: number(),

  value: attributeValue,
  text: string(),

  dataType: number().oneOf(values),
  customValues: array().of(
    object({
      valueID: number(),
      text: string()
    })
    .camelcase()
  ),

  children: array().of(ChildAttribute)
}).camelcase()


module.exports = {
  schema: schema,
  data: require('./data.json')
}
