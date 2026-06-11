import type { ISerializer } from "./serialized.types";

export class JsonSerializer implements ISerializer {

    write(data: unknown): string {
        return JSON.stringify(data);
    }

    async read<T>(json: string): Promise<T> {
        return JSON.parse(json) as T;
    }
}

export const jsonSerializer = new JsonSerializer();
