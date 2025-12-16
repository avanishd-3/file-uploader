import { expect, test } from "vitest";
import { getFileExtension } from "@/lib/utils/client-only-utils";

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