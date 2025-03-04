import { v4 as uuidv4, v1 as uuidv1, v5 as uuidv5 } from 'uuid';

/**
 * A utility class for generating, validating, and managing unique identifiers (UUIDs).
 */
export class UuidUtil {
    /**
     * Generates a new unique identifier (UUID v4).
     * UUID v4 is randomly generated and highly suitable for most use cases.
     * @returns A string representing a UUID v4.
     */
    static generateId(): string {
        return uuidv4();
    }

    /**
     * Generates a timestamp-based unique identifier (UUID v1).
     * UUID v1 includes a timestamp and a machine identifier, which can be useful in certain scenarios.
     * @returns A string representing a UUID v1.
     */
    static generateTimestampId(): string {
        return uuidv1();
    }

    /**
     * Generates a unique identifier based on the input string (UUID v5).
     * UUID v5 is namespace-based and is generated using a name and a namespace (e.g., a URL or DNS name).
     * @param name The name to generate a UUID from.
     * @param namespace The namespace for the UUID (optional, default is DNS).
     * @returns A string representing a UUID v5.
     */
    static generateNamespaceId(name: string, namespace: string = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'): string {
        return uuidv5(name, namespace); // Generates UUID v5 using the namespace
    }

    /**
     * Validates if a given string is a valid UUID (v1, v4, or v5).
     * @param id The string to validate.
     * @returns True if the string is a valid UUID, otherwise false.
     */
    static isValidId(id: string): boolean {
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    }

    /**
     * Strips all non-essential characters from a UUID, leaving only the hex values.
     * @param id The UUID string to clean.
     * @returns The cleaned UUID string or null if the input is not valid.
     */
    static cleanId(id: string): string | null {
        if (!this.isValidId(id)) return null;
        return id.replace(/-/g, ''); // Removes all dashes from the UUID.
    }

    /**
     * Converts a UUID string back into its original format.
     * This is the inverse of the `cleanId` function.
     * @param cleanedId The cleaned UUID string (without dashes).
     * @returns The UUID string in its original format or null if invalid.
     */
    static restoreId(cleanedId: string): string | null {
        if (cleanedId.length !== 32) return null; // UUID should have 32 characters
        return cleanedId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    }

    /**
     * Generates a batch of unique identifiers.
     * This can be used when multiple UUIDs are needed simultaneously.
     * @param count The number of UUIDs to generate.
     * @returns An array of UUID strings.
     */
    static generateBatch(count: number): string[] {
        if (count <= 0) {
            throw new Error('Count must be greater than 0.');
        }
        return Array.from({ length: count }, () => this.generateId());
    }

    /**
     * Returns the version of the UUID (v1, v4, v5).
     * @param id The UUID string to check.
     * @returns The version of the UUID (1, 4, or 5) or null if invalid.
     */
    static getUuidVersion(id: string): number | null {
        if (!this.isValidId(id)) return null;
        const version = id.charAt(14); // UUID version is indicated by the 15th character
        return parseInt(version, 10);
    }

    /**
     * Converts a UUID to a 64-bit number (for UUID v1 only).
     * This is useful for generating unique numeric identifiers.
     * @param id The UUID v1 string to convert.
     * @returns The 64-bit number representing the UUID v1, or null if invalid.
     */
    static uuidToNumber(id: string): number | null {
        if (this.getUuidVersion(id) !== 1) return null;
        // Convert UUID v1 to number (only supports the first 64 bits)
        const cleanedId = this.cleanId(id);
        if (!cleanedId) return null; // Checks if cleanedId is null

        return parseInt(cleanedId.substring(0, 16), 16); // Extracts the first 64 bits of the UUID
    }
}
