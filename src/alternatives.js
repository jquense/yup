import has from 'lodash/has';
import inherits from './util/inherits';
import MixedSchema from './mixed';
import { alternatives as locale } from './locale.js';
import isSchema from './util/isSchema';
import typeOf from 'type-name';
import { SynchronousPromise } from './util/SynchronousPromise';

let promise = sync => sync ? SynchronousPromise : Promise;
const invalidMarker = {};


export default function AlternativesSchema() {
    if (!(this instanceof AlternativesSchema))
        return new AlternativesSchema()

    MixedSchema.call(this, { type: 'alternatives' })
}
const defaultShouldUseForCasting = () => true;

let thenable = p => p && typeof p.then === 'function' && typeof p.catch === 'function'
const isPromiseOrType = (v, schema) => schema.isType(v) || thenable(v)// || isWrapper(v);

inherits(AlternativesSchema, MixedSchema, {
    _typeCheck(v) {
        if (this._oneOfTypeOptions) {
            const {
                schemas
            } = this._oneOfTypeOptions;
            return !!schemas.find(it => it.isType(v));
        }
        else if (this._subType) {
            return isPromiseOrType(v, this._subType);
        }
        return false
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
                if (shouldUseForCasting(schema, value, options)) {
                    try {
                        value = schema.cast(rawValue, {
                            ...options,
                            strict: this._oneOfTypeOptions.strict
                        });
                        if (schema.isType(value)) {
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
        //console.log('rawValue', rawValue, 'value', value, 'is of type', this.isType(value));
        return value;
    },
    promiseOrType(schema, {
        allowPromiseValueInSync = false
    } = {}) {
        const next = this.clone();
        next._subType = schema;
        return next.test({
            message:'A promise is not allowed in synchronous validation',
            name: 'promiseOrType',
            test(value, options) {
                const { sync: isRunningSync } = this.options;

                if (isRunningSync) {
                    if (thenable(value) && !allowPromiseValueInSync) {
                        return this.createError({})
                    }
                    return value;
                }
                const ctx = {
                    path: this.path,
                    ...options,
                    ...this.options,
                };

                if (Promise.resolve(value) === value) {
                    return value.then(realValue => {
                        return schema.validate(realValue, ctx);
                    })
                }
                else {
                    return schema.validate(value, ctx);
                }
            }
        });
    },
    oneOfType(enums, {
        message = locale.oneOfType,
        shouldUseForCasting = defaultShouldUseForCasting
    } = {}) {
        var validTypes = enums.map(schema => {
            if (schema !== false && !isSchema(schema))
                throw new TypeError(
                    '`alternatives.oneOfType()` schema must be a valid yup schema. ' +
                    'not: ' + typeOf(schema)
                )
            return schema;
        });
        let next = this.clone();
        next._oneOfTypeOptions = {
            schemas: validTypes,
            shouldUseForCasting
        };
        return next.test({
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
    }
})
