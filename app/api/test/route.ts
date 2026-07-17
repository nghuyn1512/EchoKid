import { ai } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: "Say hello."
    });
    

    return NextResponse.json(response);

  } catch (e: any) {
    console.error("FULL ERROR:", e);
    console.error("STATUS:", e.status);
    console.error("MESSAGE:", e.message);
    console.error("BODY:", e.error);

    return NextResponse.json(
      {
        status: e.status,
        message: e.message,
        error: e.error,
      },
      { status: 500 }
    );
  }
}