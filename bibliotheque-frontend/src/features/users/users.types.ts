export interface Role {
  roleName: 'BIBLIOTHECAIRE' | 'ADHERENT';
}

export interface User {
  userId: number;
  username: string;
  name: string;
  password?: string;
  role: Role[];
}

export type CreateUserPayload = Omit<User, 'userId'>;
