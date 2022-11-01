import Ajv, { JSONSchemaType } from "ajv";
import { JSONSchemaBridge } from "uniforms-bridge-json-schema";
import { Lodging } from "./models";
import { LongTextField } from "uniforms-mui";

const schema: JSONSchemaType<Lodging> = {
  title: "Guest",
  type: "object",
  properties: {
    id: { type: "integer" },
    active: { type: "boolean" },
    shown: { type: "boolean" },
    name: { type: "string" },
    owner: { type: "integer" },
    rank: { type: "number" },
    address: {
      type: "string",
      uniforms: { component: LongTextField }
    },
    daily_rate: { type: "number", minimum: 0, description: "Default price for one night" },
    guaranty: { type: "number", nullable: true, minimum: 0 },
    capacity: { type: "number", nullable: true, minimum: 0 },
    information: {
      type: "string",
      uniforms: { component: LongTextField }
    },
    tourist_tax: { type: "number", nullable: true },
    description: {
      type: "string", description: "Used by contracts generation",
      uniforms: { component: LongTextField }
    }
  },
  required: ["name", "owner", "address"]
};

const ajv = new Ajv({
  allErrors: true,
  useDefaults: true,
  keywords: ["uniforms"]
});

function createValidator<T>(schema: JSONSchemaType<T>) {
  const validator = ajv.compile(schema);

  return (model: Record<string, unknown>) => {
    validator(model);
    return validator.errors?.length ? { details: validator.errors } : null;
  };
}

const schemaValidator = createValidator(schema);

export const lodgingBridge = new JSONSchemaBridge(schema, schemaValidator);
