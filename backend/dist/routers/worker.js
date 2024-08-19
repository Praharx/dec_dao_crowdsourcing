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
const db_1 = require("../db");
const types_1 = require("../types");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SEC_WORKER = process.env.JWT_SEC_WORKER;
const MAX_SUBMISSIONS = 100;
const TOTAL_DECIMALS = 100000000;
router.post("/submission", middlewares_1.WorkerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    //@ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parsedBody = types_1.createSubmissionInput.safeParse(body);
    if (parsedBody.success) {
        const task = yield (0, db_1.getNextTask)(Number(userId));
        if (!task || (task === null || task === void 0 ? void 0 : task.id) !== Number(parsedBody.data.task_id)) {
            return res.status(411).json({
                msg: "Incorrect task Id please check"
            });
        }
        const amount = (Number(task.amount) / MAX_SUBMISSIONS).toString();
        const submission = yield prisma.submission.create({
            data: {
                option_id: Number((_a = parsedBody.data) === null || _a === void 0 ? void 0 : _a.selection),
                task_id: Number((_b = parsedBody.data) === null || _b === void 0 ? void 0 : _b.task_id),
                worker_id: Number(userId),
                amount
            }
        });
        const nextTask = yield (0, db_1.getNextTask)(Number(userId));
        return res.json({
            nextTask,
            amount
        });
    }
}));
router.get("/nextTask", middlewares_1.WorkerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const task = yield (0, db_1.getNextTask)(Number(userId));
    if (!task) {
        res.status(411).json({ msg: "No more tasks left for u to review." });
    }
    else {
        res.status(400).json({
            task
        });
    }
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
