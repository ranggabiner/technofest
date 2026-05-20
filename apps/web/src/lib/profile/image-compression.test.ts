import { describe, expect, it } from "vitest";

import {
  profilePhotoResizePlan,
  validateProfilePhotoInputFile,
} from "./image-compression";

describe("profile photo image compression", () => {
  it("center-crops landscape photos to a 512px square", () => {
    expect(profilePhotoResizePlan({ width: 1200, height: 800 })).toEqual({
      sourceX: 200,
      sourceY: 0,
      sourceSize: 800,
      outputWidth: 512,
      outputHeight: 512,
    });
  });

  it("center-crops portrait photos without upscaling small images", () => {
    expect(profilePhotoResizePlan({ width: 300, height: 700 })).toEqual({
      sourceX: 0,
      sourceY: 200,
      sourceSize: 300,
      outputWidth: 300,
      outputHeight: 300,
    });
  });

  it("validates input type, size, and empty files before compression", () => {
    expect(validateProfilePhotoInputFile(new File(["x"], "avatar.jpg", { type: "image/jpeg" }))).toEqual({ ok: true });
    expect(validateProfilePhotoInputFile(new File(["x"], "avatar.png", { type: "image/png" }))).toEqual({ ok: true });
    expect(validateProfilePhotoInputFile(new File(["x"], "avatar.webp", { type: "image/webp" }))).toEqual({
      ok: false,
      reason: "unsupported_type",
    });
    expect(validateProfilePhotoInputFile(new File([""], "avatar.jpg", { type: "image/jpeg" }))).toEqual({
      ok: false,
      reason: "empty_file",
    });
    expect(validateProfilePhotoInputFile(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "avatar.jpg", { type: "image/jpeg" }))).toEqual({
      ok: false,
      reason: "file_too_large",
    });
  });
});
