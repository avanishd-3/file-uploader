import { expect, test } from "vitest";
import { convertFileSize } from "@/lib/utils/utils";


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
