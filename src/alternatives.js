import inherits from './util/inherits';
import MixedSchema from './mixed';
import { alternatives as locale } from './locale.js';
import typeOf from 'type-name';
import { SynchronousPromise } from './util/syncPromise';

let promise = sync => sync ? SynchronousPromise : Promise;
const invalidMarker = {};


export default function AlternativesSchema() {
    if (!(this instanceof AlternativesSchema))
        return new AlternativesSchema()

    MixedSchema.call(this, { type: 'alternatives' })
}

inherits(AlternativesSchema, MixedSchema, {
    oneOfType(schemas, message = locale.oneOfType){
        return Object.assign(this.test({
            message,
            test(value){
                const { options: { sync, ...options }, path } = this;
                const resultValidator = (result) => {
                    if (result === invalidMarker) {
                        throw this.createError({
                            params: {
                                values: schemas.map(subType => typeOf(subType)).join(', ')
                            }
                        });
                    }
                    return result;
                };
                return schemas.reduce(
                    (valid, schema) => {
                        if (!schema.validate) return valid;
                        return schema
                        .validate(value, { ...options, sync, path })
                        .then(validated => validated || valid)
                        .catch(() => valid);
                    },
                    promise(sync).resolve(invalidMarker)
                ).then(resultValidator);
            }
        }), {
            isType: value => !!schemas.find(it => it.isType(value)),
            cast(rawValue){
                for (let schema of schemas) {
                    try{
                        const value = schema.cast(rawValue)
                        if(schema.isType(value)){
                            return value;
                        }
                    }
                    catch(err){
                        continue;
                    }
                }
                return this.default();
            }
        });
    }
})
