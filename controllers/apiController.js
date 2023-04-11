// import asyncHandler from "express-async-handler";
import * as jose from "jose";

const PRIVATE_PEM = process.env.LOOM_PRIVATE_KEY;
const APP_ID = process.env.LOOM_APP_ID;

export const loomApi = async (req, res) => {
  const pk = await jose.importPKCS8(PRIVATE_PEM, "RS256");

  // Construct and sign JWS
  let jws = await new jose.SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setIssuer(APP_ID)
    .setExpirationTime("3m")
    .sign(pk);

  // Write content to client and end the response
  return res.status(200).json({ jws });
};
