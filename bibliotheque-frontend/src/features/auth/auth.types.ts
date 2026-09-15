export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  jwtToken: string;
  user: {
    userId: number;
    name: string;
    role: { roleName: 'BIBLIOTHECAIRE' | 'ADHERENT' | 'Admin' | 'User' }[];
  };
}
