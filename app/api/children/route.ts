import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createChild, getChildrenByParent } from "@/services/firestore.service";
import type { CreateChildInput } from "@/types/child";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const children = await getChildrenByParent(session.user.id);
    return NextResponse.json({ children });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as CreateChildInput;
  if (!body.name || !body.ageMonths || !body.gender) {
    return NextResponse.json({ error: "Thiếu thông tin hồ sơ bé" }, { status: 400 });
  }

  try {
    const child = await createChild(session.user.id, body);
    return NextResponse.json({ child }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể tạo hồ sơ" }, { status: 500 });
  }
}
