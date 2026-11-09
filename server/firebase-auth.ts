import { createRemoteJWKSet, jwtVerify } from "jose";
import type { JWTVerifyGetKey } from "jose";
import { defaultFirebaseConfig } from "../src/services/firebase-config.ts";

const googleKeys = createRemoteJWKSet(new URL(
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
));

export type VerifyToken = (token: string) => Promise<string>;

export function createFirebaseTokenVerifier(
  projectId = defaultFirebaseConfig.projectId,
  keys: JWTVerifyGetKey = googleKeys,
): VerifyToken {
  return async token => {
    const { payload } = await jwtVerify(token, keys, {
      algorithms: ["RS256"],
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      requiredClaims: ["sub", "iat", "exp", "auth_time"],
    });
    const now = Math.floor(Date.now() / 1000);
    if (!payload.sub || payload.sub.length > 128 || typeof payload.iat !== "number"
      || payload.iat > now || typeof payload.auth_time !== "number" || payload.auth_time > now) {
      throw new Error("Invalid Firebase identity.");
    }
    return payload.sub;
  };
}
