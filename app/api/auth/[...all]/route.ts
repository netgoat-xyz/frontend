import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

const stripLength = (res: Response) => {
  res.headers.delete("content-length");
  return res;
};

export const POST = async (req: Request, ctx: any) => stripLength(await handler.POST(req));
export const GET  = async (req: Request, ctx: any) => stripLength(await handler.GET(req));