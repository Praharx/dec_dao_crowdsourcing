"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SEC = process.env.JWT_SEC;
function authMiddleware(req, res, next) {
    var _a;
    const authHeader = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : ""; // ?? used to define if the first thing is null use the value on right.
    try {
        const decoded = jsonwebtoken_1.default.verify(authHeader, JWT_SEC);
        //@ts-ignore
        if (decoded.userId) {
            //@ts-ignore
            req.userId = decoded.userId;
            return next();
        }
        else {
            return res.status(403).json({
                message: "You're not logged in."
            });
        }
    }
    catch (e) {
        return res.status(403).json({
            message: "You're not logged in."
        });
    }
}
