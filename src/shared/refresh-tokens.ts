import { v4 as uuidv4 } from "uuid";
import { JWT } from "./config";
import { insertRefreshToken } from "./queries";
import { request } from "./request";

export function newRefreshExpiry(): number {
  const now = new Date();
  const days = JWT.REFRESH_EXPIRES_IN / 1440;

  return now.setDate(now.getDate() + days);
}

export const newRefreshToken = async (
  accountId: string,
  refresh_token?: string
): Promise<string> => {
  if (!refresh_token) {
    refresh_token = uuidv4();
  }

  await request(insertRefreshToken, {
    refresh_token_data: {
      account_id: accountId,
      refresh_token,
      expires_at: new Date(newRefreshExpiry()),
    },
  });

  return refresh_token;
};
