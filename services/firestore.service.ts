import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppUser, Child, CreateChildInput } from "@/types/child";
export async function getOrCreateUser(params: {
  uid: string;
  email: string;
  name: string;
  avatarUrl: string;
}): Promise<AppUser> {
  const userRef = doc(db, "users", params.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data() as AppUser;
  }

  const newUser: AppUser = {
    uid: params.uid,
    email: params.email,
    name: params.name,
    avatarUrl: params.avatarUrl,
    childIds: [],
    createdAt: new Date().toISOString(),
  };

  await setDoc(userRef, newUser);
  return newUser;
}

export async function getUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as AppUser) : null;
}

export async function createChild(
  parentUid: string,
  input: CreateChildInput
): Promise<Child> {
  const childRef = doc(collection(db, "children"));
  const child: Child = {
    id: childRef.id,
    parentUid,
    ...input,
    createdAt: new Date().toISOString(),
  };

  await setDoc(childRef, child);

  const userRef = doc(db, "users", parentUid);
  await setDoc(userRef, { childIds: arrayUnion(childRef.id) }, { merge: true });

  return child;
}

export async function getChild(childId: string): Promise<Child | null> {
  const snap = await getDoc(doc(db, "children", childId));
  return snap.exists() ? (snap.data() as Child) : null;
}

export async function getChildrenByParent(parentUid: string): Promise<Child[]> {
  const q = query(collection(db, "children"), where("parentUid", "==", parentUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Child);
}

function todayId(childId: string, date: string) {
  return `${childId}_${date}`;
}