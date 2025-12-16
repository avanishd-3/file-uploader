import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { convertFileSize, formatDate } from "@/lib/utils/utils";

// Mock time zone to UTC so date formatting tests are consistent
// See: https://stackoverflow.com/questions/76911900/setting-a-timezone-in-vitest
beforeEach(() => {
    vi.stubEnv("TZ", "UTC");
});

afterEach(() => {
    vi.unstubAllEnvs();
});

describe("convertFileSize tests", () => {
    test("convertFileSize under 1 KB", () => {
        expect(convertFileSize(500)).toBe("500 B");
        expect(convertFileSize(1023)).toBe("1023 B");
    });

    test("convertFileSize between 1 KB and 1 MB", () => {
        expect(convertFileSize(1024)).toBe("1.0 KB");
        expect(convertFileSize(2048)).toBe("2.0 KB");
        expect(convertFileSize(15360)).toBe("15.0 KB");
        expect(convertFileSize(1048575)).toBe("1024.0 KB");
    });

    test("convertFileSize between 1 MB and 1 GB", () => {
        expect(convertFileSize(1048576)).toBe("1.0 MB");
        expect(convertFileSize(2097152)).toBe("2.0 MB");
        expect(convertFileSize(15728640)).toBe("15.0 MB");
        expect(convertFileSize(1073741823)).toBe("1024.0 MB");
    });

    test("convertFileSize over 1 GB", () => {
        expect(convertFileSize(1073741824)).toBe("1.0 GB");
        expect(convertFileSize(2147483648)).toBe("2.0 GB");
        expect(convertFileSize(16106127360)).toBe("15.0 GB");
    });

    test("convertFileSize uses only 1 decimal place", () => {
        expect(convertFileSize(1536)).toBe("1.5 KB");
        expect(convertFileSize(409799)).toBe("400.2 KB");
        expect(convertFileSize(1572864)).toBe("1.5 MB");
        expect(convertFileSize(1610612736)).toBe("1.5 GB");
    });
});

describe("formatDate tests", () => {
    test("Date today should return Today", () => {
        const today = new Date();
        expect(formatDate(today)).toBe("Today");
    });

    test("Date yesterday should return Yesterday", () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        expect(formatDate(yesterday)).toBe("Yesterday");
    });

    test("Date before 1 day ago should be in format MMM dd, yyyy", () => {
        const date = new Date("2023-01-15");
        expect(formatDate(date)).toBe("Jan 15, 2023");
    });
});

