import { NextRequest, NextResponse } from 'next/server';

const VALID_USERS: Record<string, string> = {
  denik: 'artcanchangetheworld',
};

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    if (VALID_USERS[username] !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create session payload
    const payload = {
      user: username,
      exp: Date.now() + SESSION_DURATION_MS,
    };

    const sessionToken = btoa(JSON.stringify(payload));

    const response = NextResponse.json({ success: true, user: username });

    response.cookies.set('denik_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('denik_session');
  return response;
}
