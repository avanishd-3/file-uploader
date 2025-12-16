import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { convertFileSize, formatDate, getFileExtension, getMimeType } from "@/lib/utils/utils";

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

describe("getFileExtension tests", () => {
    test("getFileExtension basic cases", () => {
        expect(getFileExtension("document.pdf")).toBe("pdf");
        expect(getFileExtension("main.js")).toBe("js");
        expect(getFileExtension("image.jpeg")).toBe("jpeg");
        expect(getFileExtension("video.mp4")).toBe("mp4");
    });

    test("getFileExtension works when file names have spaces", () => {
        expect(getFileExtension("my document.pdf")).toBe("pdf");
        expect(getFileExtension("holiday photo.jpeg")).toBe("jpeg");
        expect(getFileExtension("Annual Report.pdf")).toBe("pdf");
    });

    test("getFileExtension handles uppercase extensions", () => {
        expect(getFileExtension("Document 2.PDF")).toBe("pdf");
        expect(getFileExtension("Main.Js")).toBe("js");
        expect(getFileExtension("Image.JPEG")).toBe("jpeg");
    });

    test("getFileExtension handles files without extensions", () => {
        expect(getFileExtension("README")).toBe("");
        expect(getFileExtension("LICENSE")).toBe("");
        expect(getFileExtension("Makefile")).toBe("");
    });

    test("getFileExtension handles tar.gz files", () => {
        expect(getFileExtension("archive.somthing.tar.gz")).toBe("tar.gz");
        expect(getFileExtension("backup.TAR.GZ")).toBe("tar.gz");
        expect(getFileExtension("data.tar.gz")).toBe("tar.gz");
    });

    test("getFileExtension does not assume anything for other files with multiple periods", () => {
        expect(getFileExtension("my.document.v2.pdf")).toBe("pdf");
        expect(getFileExtension("version1.0.0.js")).toBe("js");
    });
});

describe("getMimeType tests", () => {
    test("getMimeType basic cases", () => {
        expect(getMimeType("pdf")).toBe("application/pdf");
        expect(getMimeType("json")).toBe("application/json");
        expect(getMimeType("mp3")).toBe("audio/mpeg");
        expect(getMimeType("mp4")).toBe("video/mp4");
    });

    test("getMimeType images", () => {
        expect(getMimeType("jpg")).toBe("image/jpeg");
        expect(getMimeType("jpeg")).toBe("image/jpeg");
        expect(getMimeType("png")).toBe("image/png");
        expect(getMimeType("gif")).toBe("image/gif");
        expect(getMimeType("svg")).toBe("image/svg+xml");
    });

    test("getMimeType text", () => {
        expect(getMimeType("txt")).toBe("text/plain");
        expect(getMimeType("csv")).toBe("text/csv");
        expect(getMimeType("html")).toBe("text/html");
        expect(getMimeType("md")).toBe("text/markdown");
        expect(getMimeType("css")).toBe("text/css");
        // This is the only MIME type guaranteed to work for JS
        // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types#important_mime_types_for_web_developers
        expect(getMimeType("js")).toBe("text/javascript");
    });

    test("getMimeType sql", () => {
        expect(getMimeType("sql")).toBe("application/sql");
    });

    test("getMimeType no extension", () => {
        expect(getMimeType("")).toBe("application/octet-stream");
    });
});