import { describe, expect, it } from "vitest";

import { createProfileFormSnapshot, isProfileFormSnapshotDirty } from "./form-dirty";

describe("profile form dirty detection", () => {
  it("keeps unchanged trimmed text and select values clean", () => {
    const initial = new FormData();
    initial.set("full_name", "Rangga");
    initial.set("specialization", "Cardiology");

    const current = new FormData();
    current.set("full_name", "  Rangga  ");
    current.set("specialization", "Cardiology");

    expect(isProfileFormSnapshotDirty(createProfileFormSnapshot(initial), createProfileFormSnapshot(current))).toBe(false);
  });

  it("marks edits dirty and returns clean when values revert", () => {
    const initial = new FormData();
    initial.set("full_name", "Rangga");
    initial.set("phone_number", "08123456789");

    const edited = new FormData();
    edited.set("full_name", "Rangga Putra");
    edited.set("phone_number", "08123456789");

    const reverted = new FormData();
    reverted.set("full_name", "Rangga");
    reverted.set("phone_number", "08123456789");

    const initialSnapshot = createProfileFormSnapshot(initial);

    expect(isProfileFormSnapshotDirty(initialSnapshot, createProfileFormSnapshot(edited))).toBe(true);
    expect(isProfileFormSnapshotDirty(initialSnapshot, createProfileFormSnapshot(reverted))).toBe(false);
  });

  it("ignores empty file controls and marks selected files dirty", () => {
    const initial = new FormData();
    initial.set("profile_photo", new File([], "", { type: "application/octet-stream" }));

    const unchanged = new FormData();
    unchanged.set("profile_photo", new File([], "", { type: "application/octet-stream" }));

    const selectedPhoto = new FormData();
    selectedPhoto.set("profile_photo", new File(["avatar"], "avatar.jpg", { type: "image/jpeg" }));

    const initialSnapshot = createProfileFormSnapshot(initial);

    expect(isProfileFormSnapshotDirty(initialSnapshot, createProfileFormSnapshot(unchanged))).toBe(false);
    expect(isProfileFormSnapshotDirty(initialSnapshot, createProfileFormSnapshot(selectedPhoto))).toBe(true);
  });

  it("marks file-only doctor letters form clean until a nonempty file is selected", () => {
    const initial = new FormData();
    initial.set("str", new File([], "", { type: "application/octet-stream" }));
    initial.set("sip", new File([], "", { type: "application/octet-stream" }));
    initial.set("ktp", new File([], "", { type: "application/octet-stream" }));

    const selectedLetter = new FormData();
    selectedLetter.set("str", new File([], "", { type: "application/octet-stream" }));
    selectedLetter.set("sip", new File(["pdf"], "sip.pdf", { type: "application/pdf" }));
    selectedLetter.set("ktp", new File([], "", { type: "application/octet-stream" }));

    expect(isProfileFormSnapshotDirty(createProfileFormSnapshot(initial), createProfileFormSnapshot(selectedLetter))).toBe(true);
  });
});
