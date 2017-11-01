import has from 'lodash/has';
import inherits from './util/inherits';
import MixedSchema from './mixed';
import { alternatives as locale } from './locale.js';
import isSchema from './util/isSchema';
import typeOf from 'type-name';
import { SynchronousPromise } from 'synchronous-promise';
import createValidation from './util/createValidation';
import runValidations from './util/runValidations';

let promise = sync => sync ? SynchronousPromise : Promise;
const invalidMarker = {};


export default function AlternativesSchema() {
    if (!(this instanceof AlternativesSchema))
        return new AlternativesSchema()

    MixedSchema.call(this, { type: 'alternatives' })
}
const defaultShouldUseForCasting = () => true;

inherits(AlternativesSchema, MixedSchema, {
    _typeCheck(v){
        if(this._oneOfTypeOptions){
            const {
                schemas
            } = this._oneOfTypeOptions;
            return !!schemas.find(it => it.isType(v));
        }
        return false
    },

    _validate(_value, options = {}) {
        let value = _value;
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

        const validations = [];

        if(this._oneOfType){
            validations.push(this._oneOfType(validationParams));
        }

        return runValidations({
            validations: validations, endEarly, value, path, sync
        });
    },

    _cast(rawValue, options = {}) {
        let value = rawValue;
        if (this._oneOfTypeOptions) {
            const {
                schemas,
                shouldUseForCasting = defaultShouldUseForCasting
            } = this._oneOfTypeOptions;
            for (let schema of schemas) {
                // It's difficult to decide what type we want to use for casting
                // the value. Ultimately, it's up to the developer so allow the developer
                // to decide using `shouldUseForCasting` (defaults to for all types).
                if(shouldUseForCasting(schema, value, options)){
                    try {
                        value = schema.cast(rawValue, {
                            ...options,
                            strict: this._oneOfTypeOptions.strict
                        });
                        if(schema.isType(value)){
                            break;
                        }
                    }
                    catch (err) {
                        continue // failed to cast
                    }
                }
            }
        }
        if (value === undefined && has(this, '_default')) {
            value = this.default()
        }
//        console.log("rawValue",rawValue,"value",value,"is of type",this.isType(value));
        return value;
    },

    oneOfType(enums, {
        message = locale.oneOfType,
        shouldUseForCasting = defaultShouldUseForCasting
    } = {}) {
        var next = this.clone();

        var validTypes = enums.map(schema => {
            if (schema !== false && !isSchema(schema))
                throw new TypeError(
                    '`alternatives.oneOfType()` schema must be a valid yup schema. ' +
                    'not: ' + typeOf(schema)
                )
            return schema;
        });
        next._oneOfTypeOptions = {
            schemas:validTypes,
            shouldUseForCasting
        };
        next._oneOfType = createValidation({
            message,
            name: 'oneOfType',
            test(value) {
                const { options: { sync, ...options }, path } = this;
                return validTypes.reduce(
                    (valid, schema) => {
                        if (!schema.validate) return valid;
                        return schema
                            .validate(value, { ...options, sync, path })
                            .then(validated => validated || valid)
                            .catch(() => valid);
                    },
                    promise(sync).resolve(invalidMarker)
                )
                .then(result => {
                    if (result === invalidMarker) {
                        throw this.createError({
                            params: {
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
