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
  updateDoc,
  increment,
  limit as fsLimit,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppUser, Child, CreateChildInput } from "@/types/child";
import type { DailyLog,DailyLogInput } from "@/types/dailyLog";
import type { RecommendationResult } from "@/types/recommendation";

const daily_logs = "dailyLogs";
const recommendations = "recommendations";
const children = "children";

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
  console.log(params);

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

export async function assertChildOwnership(childId: string, parentId: string){
  const snap = await getDoc(doc(db,children,childId));
  if(!snap.exists() || snap.data().parentId !== parentId){
    throw new Error("FORBIDDEN");
  }
  return snap.data() as Child;
}
export async function upsertDailyLog(
  input: DailyLogInput
): Promise<void> {
  const id = todayId(input.childId, input.date);
  const ref = doc(db, daily_logs, id);

  const existing = await getDoc(ref);

  const today = new Date().toLocaleDateString("en-CA");

  if (existing.exists() && input.date !== today) {
    throw new Error("LOG_LOCKED");
  }

  const patch: Record<string, unknown> = {
    childId: input.childId,
    date: input.date,
    status: input.markCompleted ? "completed" : "in_progress",
  };

  if (input.mood) patch.mood = input.mood;
  if (input.sleep) patch.sleep = input.sleep;
  if (input.meal) patch.meal = input.meal;
  if (input.socialInteraction) patch.socialInteraction = input.socialInteraction;
  if (input.focus) patch.focus = input.focus;
  if (input.freeTextNote !== undefined)
    patch.freeTextNote = input.freeTextNote;

  if (!existing.exists()) {
    await setDoc(ref, {
      ...patch,
      meltdown: {
        totalCount: 0,
        events: [],
      },
      editableUntil: new Date(`${input.date}T23:59:59`).toISOString(),
    });
  } else {
    await updateDoc(ref, patch);
  }

  if (input.meltdownEvent) {
    await updateDoc(ref, {
      "meltdown.totalCount": increment(1),
      "meltdown.events": arrayUnion({
        time: new Date().toTimeString().slice(0, 5),
        trigger: input.meltdownEvent.trigger,
      }),
    });
  }
}
export async function getDailyLog(childId: string, date: string): Promise<DailyLog | null>{
  const snap = await getDoc(doc(db,daily_logs,todayId(childId,date)));
  return snap.exists() ? ({id: snap.id, ... snap.data()}as DailyLog) : null;
}

export async function getRecentLogs(childId: string, days = 7): Promise<DailyLog[]>{
  const q = query(
    collection(db,daily_logs),
    where("childId","==", childId),
    orderBy("date","desc"),
    fsLimit(days)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({id:d.id, ...d.data()}as DailyLog));
}

export async function saveRecommendation(
  logId: string,
  data: Omit<RecommendationResult, "createdAt">
): Promise<void>{
  await setDoc(doc(db, recommendations,logId),{
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getRecommendation(logId:string): Promise<RecommendationResult | null>{
  const snap = await getDoc(doc(db,recommendations,logId));
  return snap.exists() ? (snap.data() as RecommendationResult) : null;
}

export async function getLogsInRange(childId: string, days: number): Promise<DailyLog[]> {
  const q = query(
    collection(db, daily_logs),
    where("childId", "==", childId),
    orderBy("date", "desc"),
    fsLimit(days)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs .map((d) => ({ id: d.id, ...d.data() } as DailyLog)).reverse(); 
}
