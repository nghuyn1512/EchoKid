export interface Diagnosis {
  status: "suspected" | "diagnosed" | "not_evaluated";
  type: string[];
  diagnosedDate: string | null;
}

export interface Child {
  id: string;
  parentUid: string;
  name: string;
  ageMonths: number;
  gender: "male" | "female" | "other";
  diagnosis: Diagnosis;
  goals: string[];
  createdAt: string;
}

export interface CreateChildInput {
  name: string;
  ageMonths: number;
  gender: "male" | "female" | "other";
  diagnosis: Diagnosis;
  goals: string[];
}

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  avatarUrl: string;
  childIds: string[];
  createdAt: string;
}