import type { SchemaItem } from '@ethereum-attestation-service/eas-sdk';

export type TypedSchemaItem<T> = SchemaItem & { name: keyof T };
