import { defaultSession, getSession } from "../../../lib";

export async function GET(request: Request, response: Response) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ defaultSession });
    }
    return Response.json({
      isLoggedIn: session.isLoggedIn,
      userInfo: session.userInfo,
    });
  } catch (e) {
    return Response.json({ error: e }, { status: 500 });
  }
}
