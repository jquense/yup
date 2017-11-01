import inherits from './util/inherits';
import MixedSchema from './mixed';
import { alternatives as locale } from './locale.js';
import isSchema from './util/isSchema';
import typeOf from 'type-name';
import { SynchronousPromise } from 'synchronous-promise';


let promise = sync => sync ? SynchronousPromise: Promise;
const invalidMarker = {};


export default function AlternativesSchema() {
    if (!(this instanceof AlternativesSchema))
        return new AlternativesSchema()

    MixedSchema.call(this, { type: 'alternatives' })
}

inherits(AlternativesSchema, MixedSchema, {

    _typeCheck(value) {
        return true;
    },

    oneOfType(enums, {
        message = locale.oneOfType,
        cast,
    }={} ) {
        var validTypes = enums.map(schema => {
            if (schema !== false && !isSchema(schema))
                throw new TypeError(
                    '`alternatives.oneOfType()` schema must be a valid yup schema. ' +
                    'not: ' + typeOf(schema)
                )
            cast = cast || schema;
            return schema;
        });
        return this.test({
            message,
            name: 'oneOfType',
            test(value) {
                const {options:{sync},path} = this;
                return validTypes.reduce((valid, schema)=>{
                    if(!schema.validate) return valid;
                    return schema.validate(value, {sync,path})
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
    }
})
