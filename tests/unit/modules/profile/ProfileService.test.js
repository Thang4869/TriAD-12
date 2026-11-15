import { describe, expect, it, vi } from "vitest";
import { ProfileService } from "../../../../src/modules/profile/ProfileService.js";

describe("ProfileService", () => {
  it("loads the authenticated user's profile", async () => {
    const profile = { id: "user-1", email: "user@example.com" };
    const api = { get: vi.fn().mockResolvedValue(profile) };
    const service = new ProfileService(api);

    await expect(service.getProfile()).resolves.toEqual(profile);
    expect(api.get).toHaveBeenCalledOnce();
    expect(api.get).toHaveBeenCalledWith("/users/me");
  });

  it("updates the authenticated user's profile", async () => {
    const data = { firstName: "An", lastName: "Nguyen", phone: "0900000000" };
    const updated = { id: "user-1", ...data };
    const api = { put: vi.fn().mockResolvedValue(updated) };
    const service = new ProfileService(api);

    await expect(service.updateProfile(data)).resolves.toEqual(updated);
    expect(api.put).toHaveBeenCalledOnce();
    expect(api.put).toHaveBeenCalledWith("/users/me", data);
  });

  it("propagates API errors without changing the response", async () => {
    const error = new Error("Unavailable");
    const api = { get: vi.fn().mockRejectedValue(error) };
    const service = new ProfileService(api);

    await expect(service.getProfile()).rejects.toBe(error);
  });
});
