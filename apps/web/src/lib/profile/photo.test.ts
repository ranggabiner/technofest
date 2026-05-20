import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  removeCalls: [] as Array<{ bucket: string; paths: string[] }>,
  updateError: null as unknown,
  uploadError: null as unknown,
  uploadOptions: null as null | { cacheControl?: string; contentType?: string; upsert?: boolean },
  uploadedPath: "",
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/config/env", () => ({
  requireEnv: () => ({
    data: {
      NEXT_PUBLIC_SUPABASE_URL: "https://project-ref.supabase.co",
    },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    storage: {
      from: (bucket: string) => ({
        getPublicUrl: (path: string) => ({
          data: {
            publicUrl: `https://project-ref.supabase.co/storage/v1/object/public/${bucket}/${path}`,
          },
        }),
        remove: async (paths: string[]) => {
          mocks.removeCalls.push({ bucket, paths });
          return { data: [], error: null };
        },
        upload: async (path: string, _file: File, options: { cacheControl?: string; contentType?: string; upsert?: boolean }) => {
          mocks.uploadedPath = path;
          mocks.uploadOptions = options;
          return { data: { path }, error: mocks.uploadError };
        },
      }),
    },
  }),
}));
vi.mock("node:crypto", () => ({
  randomUUID: () => "11111111-1111-4111-8111-111111111111",
}));

import {
  PROFILE_PHOTO_BUCKET,
  replaceProfilePhoto,
  validateProfilePhotoFile,
} from "./photo";

describe("profile photo storage", () => {
  beforeEach(() => {
    mocks.removeCalls = [];
    mocks.updateError = null;
    mocks.uploadError = null;
    mocks.uploadOptions = null;
    mocks.uploadedPath = "";
  });

  it("accepts JPEG and PNG profile photos up to 5 MB", () => {
    expect(validateProfilePhotoFile(new File(["x"], "avatar.jpg", { type: "image/jpeg" }))).toEqual({ ok: true });
    expect(validateProfilePhotoFile(new File(["x"], "avatar.png", { type: "image/png" }))).toEqual({ ok: true });
    expect(validateProfilePhotoFile(new File(["x"], "avatar.gif", { type: "image/gif" }))).toEqual({
      ok: false,
      reason: "unsupported_type",
    });
    expect(validateProfilePhotoFile(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "avatar.png", { type: "image/png" }))).toEqual({
      ok: false,
      reason: "file_too_large",
    });
  });

  it("uploads a new object, saves its public URL, then removes the old own-folder photo", async () => {
    const savedUrls: string[] = [];
    const previousPhotoUrl =
      "https://project-ref.supabase.co/storage/v1/object/public/profile-photos/user-1/profile/old.png";

    const result = await replaceProfilePhoto({
      authUserId: "user-1",
      file: new File(["new"], "fresh.png", { type: "image/png" }),
      previousPhotoUrl,
      savePhotoUrl: async (profilePhotoUrl) => {
        savedUrls.push(profilePhotoUrl);
      },
    });

    expect(mocks.uploadedPath).toBe("user-1/profile/11111111-1111-4111-8111-111111111111.png");
    expect(mocks.uploadOptions).toEqual({
      cacheControl: "31536000",
      contentType: "image/png",
      upsert: false,
    });
    expect(savedUrls).toEqual([result.profilePhotoUrl]);
    expect(result).toEqual({
      profilePhotoUrl:
        "https://project-ref.supabase.co/storage/v1/object/public/profile-photos/user-1/profile/11111111-1111-4111-8111-111111111111.png",
      objectPath: "user-1/profile/11111111-1111-4111-8111-111111111111.png",
    });
    expect(mocks.removeCalls).toEqual([
      { bucket: PROFILE_PHOTO_BUCKET, paths: ["user-1/profile/old.png"] },
    ]);
  });

  it("deletes the new upload when saving the profile row fails", async () => {
    await expect(
      replaceProfilePhoto({
        authUserId: "user-1",
        file: new File(["new"], "fresh.jpg", { type: "image/jpeg" }),
        previousPhotoUrl: null,
        savePhotoUrl: async () => {
          throw new Error("row update failed");
        },
      }),
    ).rejects.toThrow("row update failed");

    expect(mocks.removeCalls).toEqual([
      {
        bucket: PROFILE_PHOTO_BUCKET,
        paths: ["user-1/profile/11111111-1111-4111-8111-111111111111.jpg"],
      },
    ]);
  });
});
