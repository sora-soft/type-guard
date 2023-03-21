import {AnySchema} from './Ajv.js';
import {TypeGuardError} from './TypeGuardError.js';
import {ajv} from './Const.js';

class TypeGuard {
  static assertType<T>(value: unknown, schema: void): asserts value is T {
    if (!(schema as unknown)) {
      throw new Error('Type guard should use under ttypescript');
    }
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
    if (!(schema as unknown)) {
      throw new Error('Type guard should use under ttypescript');
    }
    const validate = ajv.compile(schema as unknown as AnySchema);
    const valid = validate(value);
    return valid as boolean;
  }
}

export {TypeGuard};
