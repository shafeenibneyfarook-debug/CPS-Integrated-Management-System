// ======================================================
// CPS MANAGEMENT SYSTEM - SAFE ERROR FORMATTER
// ======================================================

/**
 * Safely extracts a displayable string from any error or response object.
 * Guarantees that the return value is ALWAYS a string, preventing React Error #31 (object as child).
 */
export const formatError = (error, fallback = "An unexpected error occurred. Please try again.") => {
    if (!error) return "";
    if (typeof error === "string") return error;

    try {
        if (error.response?.data) {
            const data = error.response.data;
            if (typeof data === "string") return data;
            if (typeof data.message === "string") return data.message;
            if (typeof data.message === "object" && data.message !== null) {
                return data.message.message || data.message.code || JSON.stringify(data.message);
            }
            if (typeof data.error === "string") return data.error;
            if (typeof data.error === "object" && data.error !== null) {
                return data.error.message || data.error.code || JSON.stringify(data.error);
            }
            if (Array.isArray(data.errors)) {
                return data.errors.map(e => (typeof e === "string" ? e : e?.message || JSON.stringify(e))).join(". ");
            }
        }

        if (typeof error.message === "string") return error.message;

        if (typeof error === "object" && error !== null) {
            if (typeof error.message === "string") return error.message;
            if (error.code) return String(error.code);
            return JSON.stringify(error);
        }
    } catch {
        return fallback;
    }

    return fallback;
};

export default formatError;
