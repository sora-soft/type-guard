import {Ajv, AnySchema} from './Ajv.js';
import {TypeGuardError} from './TypeGuardError.js';

const ajv = new Ajv({
  allowUnionTypes: true,
});

class TypeGuard {
  static assertType<T>(value: unknown, schema: void): asserts value is T {
    const validate = ajv.compile(schema as unknown as AnySchema);
    const valid = validate(value);
    if (!valid) {
      if (validate.errors && validate.errors.length) {
        throw new TypeGuardError(validate.errors[0]);
      } else {
        throw new TypeGuardError(null);
      }
    }
  }

  static valid<T>(value: unknown, schema: void): value is T {
    const validate = ajv.compile(schema as unknown as AnySchema);
    const valid = validate(value);
    return valid as boolean;
  }
}

export {TypeGuard};
