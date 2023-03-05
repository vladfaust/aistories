import { Request, Response } from "express";

export default async function (req: Request, res: Response) {
  res.clearCookie("userId", {
    httpOnly: true,
  });

  res.end();
}
