import inherits from './util/inherits';
import MixedSchema from './mixed';
import { alternatives as locale } from './locale.js';
import isSchema from './util/isSchema';
import typeOf from 'type-name';
import { SynchronousPromise } from 'synchronous-promise';
import createValidation from './util/createValidation';
import printValue from './util/printValue';
import runValidations from './util/runValidations';

let promise = sync => sync ? SynchronousPromise: Promise;
const invalidMarker = {};


export default function AlternativesSchema() {
    if (!(this instanceof AlternativesSchema))
        return new AlternativesSchema()

    MixedSchema.call(this, { type: 'alternatives' })
}

inherits(AlternativesSchema, MixedSchema, {

    _validate(_value, options = {}) {
        let value  = _value;
        let originalValue = options.originalValue != null ?
            options.originalValue : _value

        let isStrict = this._option('strict', options)
        let endEarly = this._option('abortEarly', options)

        let sync = options.sync
        let path = options.path
        let label = this._label

        if (!isStrict) {
            value = this._cast(value, { assert: false, ...options })
        }
        // value is cast, we can check if it meets type requirements
        let validationParams = { value, path, schema: this, options, label, originalValue, sync }
        let initialTests = []

        if (this._oneOfType)
            initialTests.push(this._oneOfType(validationParams));

        return runValidations({ validations: initialTests, endEarly, value, path, sync })
        .then(value => runValidations({
            path,
            sync,
            value,
            endEarly,
            validations: this.tests.map(fn => fn(validationParams)),
        }))
    },

    resolveSchemaUsingValue(value){
        if(this._oneOfTypeOptions){
            return this._oneOfTypeOptions.find(typeOption =>{
                return typeOption.isValidSync(value)
            })||this
        }
        return this;
    },

    isType(type){
        if(this._oneOfTypeOptions){
            return this._oneOfTypeOptions.find(it => it === type);
        }
        return false;
    },

    cast(value, options = {}) {
        let resolvedSchema = this.resolveSchemaUsingValue(value);
        let result = resolvedSchema._cast(value, options);

        if (
            value !== undefined &&
            options.assert !== false &&
            resolvedSchema.isType(result) !== true
        ) {
            let formattedValue = printValue(value);
            let formattedResult = printValue(result);
            throw new TypeError(
                `The value of ${options.path || 'field'} could not be cast to a value ` +
                `that satisfies the schema type: "${resolvedSchema._type}". \n\n` +
                `attempted value: ${formattedValue} \n` +
                ((formattedResult !== formattedValue)
                    ? `result of cast: ${formattedResult}` : '')
            );
        }

        return result;
    },

    oneOfType(enums, {
        message = locale.oneOfType,
        cast,
    }={} ) {
        var next = this.clone();

        var validTypes = enums.map(schema => {
            if (schema !== false && !isSchema(schema))
                throw new TypeError(
                    '`alternatives.oneOfType()` schema must be a valid yup schema. ' +
                    'not: ' + typeOf(schema)
                )
            cast = cast || schema;
            return schema;
        });
        next._oneOfTypeOptions = validTypes;
        next._oneOfType = createValidation({
            message,
            name: 'oneOfType',
            test(value) {
                const {options:{sync}, path} = this;
                return validTypes.reduce((valid, schema)=>{
                    if(!schema.validate) return valid;
                    return schema.validate(value, {sync, path})
                                 .then(validated=> validated || valid)
                                 .catch(()=> valid);
                }, promise(sync).resolve(invalidMarker))
                                 .then(result=>{
                    if(result === invalidMarker){
                        throw this.createError({
                            params:{
                                values: validTypes.map(subType => typeOf(subType)).join(', ')
                            }
                        });
                    }
                    return result;
                });
            }
        });
        return next;
    }
})
