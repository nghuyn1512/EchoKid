import { ai } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash", 
      contents: "Say good moring",
    });
    
    return NextResponse.json({ text: response.text });

  } catch (e: any) {
    console.error("FULL ERROR:", e);
    return NextResponse.json(
      {
        status: e.status || 500,
        message: e.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}