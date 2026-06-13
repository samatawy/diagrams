import type { ISerializer } from "./serialized.types";

/**
 * Serializes and deserializes data to and from JSON format.
 */
export class JsonSerializer implements ISerializer {

    /**
     * Serializes the given data to a JSON string.
     * @param data The data to serialize.
     * @returns A JSON string representing the serialized data.
     */
    write(data: unknown): string {
        return JSON.stringify(data);
    }

    /**
     * Deserializes the given JSON string to an object of type T.
     * @param json The JSON string to deserialize.
     * @returns A promise that resolves to an object of type T.
     */
    async read<T>(json: string): Promise<T> {
        return JSON.parse(json) as T;
    }
}

/**
 * The default JSON serializer instance for use in the application.
 * This can be imported conveniently and used wherever JSON serialization or deserialization is needed.
 */
export const jsonSerializer = new JsonSerializer();
