"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.WorkerMiddleware = WorkerMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SEC = process.env.JWT_SEC;
const JWT_SEC_WORKER = process.env.JWT_SEC_WORKER;
function authMiddleware(req, res, next) {
    var _a;
    const authHeader = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : ""; // ?? used to define if the first thing is null use the value on right.
    try {
        const decoded = jsonwebtoken_1.default.verify(authHeader, JWT_SEC);
        //@ts-ignore
        if (decoded.userId) {
            //@ts-ignore
            req.userId = decoded.userId;
            console.log("middleware job done.");
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
function WorkerMiddleware(req, res, next) {
    var _a;
    const authHeader = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : ""; // ?? used to define if the first thing is null use the value on right.
    try {
        const decoded = jsonwebtoken_1.default.verify(authHeader, JWT_SEC_WORKER);
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
