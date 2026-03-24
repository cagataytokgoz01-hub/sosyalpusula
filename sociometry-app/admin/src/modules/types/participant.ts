export type Gender = 'kiz' | 'erkek';

export interface Participant {
  id: string;
  fullName: string;
  gender: Gender;
  createdAt: string;
  updatedAt: string;
}
