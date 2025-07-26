// src/constant/users.constant.ts
// List of allowed users for login

export interface UserCredential {
  username: string;
  password: string;
}

export const USERS: UserCredential[] = [
  { username: "sagar", password: "sagar" },
  { username: "shreya", password: "shreya" },
  { username: "jaydip", password: "jaydip" },
  { username: "sagarmali", password: "sagarmali" },
  { username: "akhil", password: "akhil" },
  { username: "admin", password: "admin" },
];
