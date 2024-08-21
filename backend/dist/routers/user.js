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
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
const middlewares_1 = require("../middlewares");
const types_1 = require("../types");
const web3_js_1 = require("@solana/web3.js");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const JWT_SEC = process.env.JWT_SEC;
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const ACCESS_KEY_PASSWORD = process.env.ACCESS_KEY_PASSWORD;
const DEFAULT_TITLE = "Select the most clickable thumbnail.";
const PARENT_WALLET_ADDRESS = "8BE2bhzokoZmuKscpNbAKGxHAQL5xSEhKnSHjgwpuowY";
const connection = new web3_js_1.Connection("https://solana-devnet.g.alchemy.com/v2/mSOKolKC5DWNK9KeMWIEoN9TxSNWspzy");
const s3Client = new client_s3_1.S3Client({
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: ACCESS_KEY_PASSWORD,
    },
    region: "eu-north-1"
});
router.get("/task", middlewares_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const taskId = req.query.taskId;
    //@ts-ignore
    const userId = req.userId;
    const taskDetails = yield prisma.task.findFirst({
        where: {
            id: Number(taskId),
            user_id: userId
        },
        include: {
            options: true
        }
    });
    if (!taskDetails) {
        return res.status(411).json({
            msg: "The given task_id doesn't exist on the user_id."
        });
    }
    const responses = yield prisma.submission.findMany({
        where: {
            task_id: Number(taskId)
        },
        include: {
            option: true
        }
    });
    const result = {};
    taskDetails.options.forEach(option => {
        result[option.id] = {
            count: 1,
            option: {
                imageUrl: option.image_url
            }
        };
    });
    responses.forEach(r => {
        result[r.option_id].count++;
    });
    res.json({
        result,
        taskDetails
    });
}));
router.get("/preSignedUrl", middlewares_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const { url, fields } = yield (0, s3_presigned_post_1.createPresignedPost)(s3Client, {
        Bucket: 'decentralised-dao-labour',
        Key: `/uploads/${userId}/${Math.random()}/image.jpg`,
        Conditions: [
            ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Fields: {
            'Content-Type': 'image/jpg'
        },
        Expires: 3600
    });
    res.json({
        preSignedUrl: url,
        fields
    });
}));
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { signature, publicKey } = req.body;
    try {
        const sign = new Uint8Array(signature.data);
        console.log("Signature Length backend:", sign.length);
        const message = new TextEncoder().encode("You have signed-in to Crowd Source.");
        const result = tweetnacl_1.default.sign.detached.verify(message, sign, new web3_js_1.PublicKey(publicKey).toBytes());
        if (!result) {
            return res.status(402).json({
                msg: "no result received."
            });
        }
    }
    catch (e) {
        console.log(e);
        return res.status(400).json({
            msg: "internal server error"
        });
    }
    const user = yield prisma.user.upsert({
        where: {
            address: publicKey
        },
        update: {}, // if you dont have anything to update, u can keep it blank.
        create: {
            address: publicKey,
        },
    });
    const token = jsonwebtoken_1.default.sign({
        userId: user.id
    }, JWT_SEC);
    res.json({ token });
}));
router.post("/task", middlewares_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const body = req.body;
    //@ts-ignore
    const user_id = req.userId;
    const parsedData = types_1.createTaskInput.safeParse(body);
    if (!parsedData.success) {
        return res.status(411).json({
            msg: "Incorrect data type please check"
        });
    }
    console.log("signature", parsedData.data.signature);
    const transaction = yield connection.getTransaction(parsedData.data.signature, {
        maxSupportedTransactionVersion: 1
    });
    console.log(transaction);
    if (((_b = (_a = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _a === void 0 ? void 0 : _a.postBalances[1]) !== null && _b !== void 0 ? _b : 0) - ((_d = (_c = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _c === void 0 ? void 0 : _c.preBalances[1]) !== null && _d !== void 0 ? _d : 0) !== 100000000) {
        return res.status(411).json({
            message: "Transaction signature/amount increment."
        });
    }
    if (((_e = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(1)) === null || _e === void 0 ? void 0 : _e.toString()) !== PARENT_WALLET_ADDRESS) {
        return res.status(411).json({
            message: "Transaction sent to wrong address."
        });
    }
    // parsing the signature over here to verfiy the amount paid.
    let response = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const response = yield tx.task.create({
            data: {
                title: (_a = parsedData.data.title) !== null && _a !== void 0 ? _a : DEFAULT_TITLE,
                amount: 1,
                signature: parsedData.data.signature,
                user_id: user_id
            }
        });
        yield tx.option.createMany({
            data: parsedData.data.options.map(x => ({
                image_url: x.imageUrl,
                task_id: response.id
            }))
        });
        return response;
    }));
    res.json({
        id: response.id
    });
}));
exports.default = router;
