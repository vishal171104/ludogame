import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    nextauth: {
      url: process.env.NEXTAUTH_URL || "http://localhost:3000",
      secret: process.env.NEXTAUTH_SECRET ? "configured" : "using fallback",
    },
  })
}
