import { NextResponse } from "next/server"
import { API_BASE as API_URL } from "@/lib/api-config"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password } = body

    // Call backend signup endpoint
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { message: data.detail || "Registration failed" },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    )
  }
}
