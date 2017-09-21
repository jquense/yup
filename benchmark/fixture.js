const yup = require('../src');
const data = require('./data.json');

const { object, array, string, bool, number, mixed, date } = yup;

const AttributeDatatype = {
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
  DateOfBirth: 13,
};

const attributeValue = mixed()
  .when('dataType', (dataType) => {
    let newSchema;

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

    return newSchema.nullable();
  });

const values = Object.keys(AttributeDatatype).map(k => AttributeDatatype[k]);

const ChildAttribute = object({
  objectAttrID: number(),
  attributeID: number(),
  attribute: string(),

  value: attributeValue,

  text: string(),

  dataType: number()
    .oneOf(values),

  seqID: number(),

}).camelCase();

const schema = object({

  objectAttrID: number(),
  attributeID: number(),
  contactID: number(),
  eventID: number(),
  docID: number(),

  attribute: string(),
  isActive: bool(),
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
      text: string(),
    })
      .camelCase(),
  ),

  children: array().of(ChildAttribute),
}).camelCase();

module.exports = {
  schema,
  data,
};
