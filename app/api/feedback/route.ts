import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
assertChildOwnership,
createFeedback,
getFeedbackList,
getObservation,
} from "@/services/firestore.service";
import type { FeedbackInput } from "@/types/feedback";

function isValidRating(value: unknown): value is number {
return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;
}
 
export async function POST(req: NextRequest) {
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
 
const body = (await req.json()) as FeedbackInput;
if (!body.childId || !body.observationId || !body.content?.trim()) {
return NextResponse.json(
{ error: "childId, observationId và content là bắt buộc." },
{ status: 400 }
);
}
if (body.rating !== undefined && !isValidRating(body.rating)) {
return NextResponse.json(
{ error: "rating phải là số nguyên từ 1 đến 5." },
{ status: 400 }
);
}
 
try {
await assertChildOwnership(body.childId, session.user.id);
const observation = await getObservation(body.observationId);
if (!observation || observation.childId !== body.childId) {
return NextResponse.json({ error: "Không tìm thấy lần ghi nhận." }, { status: 404 });
}
 
const record = await createFeedback({
childId: body.childId,
observationId: body.observationId,
content: body.content.trim(),
wasHelpful: body.wasHelpful,
rating: body.rating,
});
return NextResponse.json({ feedback: record }, { status: 201 });
} catch (error) {
if (error instanceof Error && error.message === "FORBIDDEN") {
return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
console.error("Create feedback failed:", error);
return NextResponse.json({ error: "Không thể lưu feedback." }, { status: 500 });
}
}
 
export async function GET(req: NextRequest) {
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
 
const childId = req.nextUrl.searchParams.get("childId");
const observationId = req.nextUrl.searchParams.get("observationId") ?? undefined;
if (!childId) {
return NextResponse.json({ error: "childId là bắt buộc." }, { status: 400 });
}
 
try {
await assertChildOwnership(childId, session.user.id);
if (observationId) {
const observation = await getObservation(observationId);
if (!observation || observation.childId !== childId) {
return NextResponse.json({ error: "Không tìm thấy lần ghi nhận." }, { status: 404 });
}
}
 
const items = await getFeedbackList(childId, observationId);
return NextResponse.json({ feedback: items });
} catch (error) {
if (error instanceof Error && error.message === "FORBIDDEN") {
return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
console.error("Load feedback failed:", error);
return NextResponse.json({ error: "Không thể tải feedback." }, { status: 500 });
}
}