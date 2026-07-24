import { apiRequest } from '@/services/apiClient';
import type { FarmerProfile } from '@/types/farmer';

export interface AuthResponse {
  token: string;
  profile: FarmerProfile;
}

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  password_confirmation: string;
  phoneNumber?: string;
  farmName?: string;
  farmLocation?: string;
  farmLatitude?: number;
  farmLongitude?: number;
  farmSizeM2?: number;
  soilType?: string;
  irrigationAccess?: FarmerProfile['irrigationAccess'];
  crops?: string[];
  experienceLevel?: FarmerProfile['experienceLevel'];
};

export const authApi = {
  login(identifier: string, password: string) {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { identifier, password },
    });
  },

  register(payload: RegisterPayload) {
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload,
    });
  },

  logout(token: string) {
    return apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
      token,
    });
  },

  me(token: string) {
    return apiRequest<{ profile: FarmerProfile }>('/auth/me', {
      method: 'GET',
      token,
    });
  },

  requestPasswordReset(identifier: string) {
    return apiRequest<{ message: string }>('/auth/recovery', {
      method: 'POST',
      body: { identifier },
    });
  },

  resetPasswordWithCode(payload: {
    identifier: string;
    code: string;
    password: string;
    password_confirmation: string;
  }) {
    return apiRequest<{ message: string }>('/auth/recovery/reset', {
      method: 'POST',
      body: payload,
    });
  },

  updateProfile(token: string, payload: Record<string, any>) {
    return apiRequest<{ message: string; profile: FarmerProfile }>('/auth/profile', {
      method: 'PUT',
      token,
      body: payload,
    });
  },

  changePassword(token: string, payload: { currentPassword: string; newPassword: string; newPassword_confirmation: string }) {
    return apiRequest<{ message: string }>('/auth/change-password', {
      method: 'POST',
      token,
      body: payload,
    });
  },
};
