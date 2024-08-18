"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middlewares_1 = require("../middlewares");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SEC_WORKER = process.env.JWT_SEC_WORKER;
router.get("/nextTask", middlewares_1.WorkerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const task = yield prisma.task.findFirst({
        where: {
            submissions: {
                none: {
                    worker_id: userId,
                }
            },
            done: false
        }
    });
    res.json({ task });
}));
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hardcodedWalletAddress = "8BE2bhzokoZmuKscpNbAKGxHAQL5xSEhKnSHjgwpuowY";
    const user = yield prisma.worker.upsert({
        where: {
            address: hardcodedWalletAddress
        },
        update: {}, // if you dont have anything to update, u can keep it blank.
        create: {
            address: hardcodedWalletAddress,
            pending_amount: 0,
            locked_amount: 0
        },
    });
    const token = jsonwebtoken_1.default.sign({
        userId: user.id
    }, JWT_SEC_WORKER);
    res.json({ token });
}));
exports.default = router;
