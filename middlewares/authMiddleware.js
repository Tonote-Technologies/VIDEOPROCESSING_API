import Jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// const authUser = async (req, res, next) => {
//   if (req.headers.cookie) {
//     try {
//       let token = req.headers.cookie.split("=")[1];
//       if (token) {
//         const decoded = Jwt.verify(token, process.env.JWT_SECRET);
//         const user = await User.findById(decoded.id).select("-password");
//         req.id = user._id;
//         next();
//       }
//     } catch (error) {
//       return res.status(401).json({ message: "Unauthorized, token failed" });
//     }
//   } else {
//     return res.status(401).json({ message: "Unauthorized, no token" });
//   }
// };

const authUser = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  Jwt.verify(token, process.env.JWT_ACCESS_KEY, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    const user = await User.findById(decoded.id).select("-password").lean();
    req.user = user;
    next();
  });
};

const authAdmin = (req, res, next) => {
  if (req.user && req.user.is_admin) {
    next();
  } else {
    res.status(404);
    throw new Error("Not authorized as an admin");
  }
};

export { authUser, authAdmin };
