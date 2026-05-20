import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getInitials, ProfileAvatar } from "./profile-avatar";

describe("profile avatar", () => {
  it("renders saved profile photos as loadable images with initials fallback", () => {
    const profilePhotoUrl =
      "https://project-ref.supabase.co/storage/v1/object/public/profile-photos/user-1/profile/avatar.png";
    const html = renderToStaticMarkup(
      React.createElement(ProfileAvatar, {
        src: profilePhotoUrl,
        name: "Budi Santoso",
        className: "size-12",
      }),
    );

    expect(html).toContain("<img");
    expect(html).toContain(profilePhotoUrl);
    expect(html).toContain(">BS<");
    expect(html).not.toContain("background-image");
  });

  it("keeps a real image error fallback instead of relying on a silent CSS background", () => {
    const source = readFileSync(new URL("./profile-avatar.tsx", import.meta.url), "utf8");

    expect(source).toContain("onError={() => setFailed(true)}");
    expect(source).toContain("if (failed) return null");
  });

  it("derives initials from the first two name parts", () => {
    expect(getInitials("Budi Santoso")).toBe("BS");
    expect(getInitials("", "M")).toBe("M");
  });
});
