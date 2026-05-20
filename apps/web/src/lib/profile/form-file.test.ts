import { describe, expect, it } from "vitest";

import { readSelectedProfilePhotoFile } from "./form-file";

describe("profile photo form file reader", () => {
  it("ignores browser multipart placeholders when no valid photo was selected", () => {
    const formData = new FormData();
    formData.set("profile_photo", new File([], "profile_photo", { type: "application/octet-stream" }));

    expect(readSelectedProfilePhotoFile(formData, "profile_photo")).toBeNull();
  });

  it("returns selected photo only when the valid-selection marker is present", () => {
    const file = new File(["avatar"], "avatar.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.set("profile_photo_selected", "1");
    formData.set("profile_photo", file);

    expect(readSelectedProfilePhotoFile(formData, "profile_photo")).toBe(file);
  });

  it("keeps marked empty selected files available for photo validation", () => {
    const file = new File([], "empty.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.set("profile_photo_selected", "1");
    formData.set("profile_photo", file);

    expect(readSelectedProfilePhotoFile(formData, "profile_photo")).toBe(file);
  });
});
