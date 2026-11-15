import { apiService } from "../../shared/services/api.service.js";

export class ProfileService {
  constructor(api = apiService) {
    this.api = api;
  }

  getProfile() {
    return this.api.get("/users/me");
  }

  updateProfile(data) {
    return this.api.put("/users/me", data);
  }
}
