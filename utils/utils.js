import Jwt from "jsonwebtoken";

const genAccessToken = (id, full_name, email) => {
  return Jwt.sign({ id, full_name, email }, process.env.JWT_ACCESS_KEY, {
    expiresIn: "1h",
  });
};

const genRefreshToken = (id, full_name, email) => {
  return Jwt.sign({ id, full_name, email }, process.env.JWT_REFRESH_KEY, {
    expiresIn: "1d",
  });
};

const firstLetterToUpperCase = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export { genAccessToken, genRefreshToken, firstLetterToUpperCase };
