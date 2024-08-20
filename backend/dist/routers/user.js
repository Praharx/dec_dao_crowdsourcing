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
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
const middlewares_1 = require("../middlewares");
const types_1 = require("../types");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const JWT_SEC = process.env.JWT_SEC;
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const ACCESS_KEY_PASSWORD = process.env.ACCESS_KEY_PASSWORD;
const DEFAULT_TITLE = "Select the most clickable thumbnail.";
const TOTAL_DECIMALS = process.env.TOTAL_DECIMALS;
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
    console.log(url, fields);
    res.json({
        preSignedUrl: url,
        fields
    });
}));
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hardcodedWalletAddress = "8BE2bhzokoZmuKscpNbAKGxHAQL5xSEhKnSHjgwpuowY";
    const hardcodedAddress2 = "Iamsfortrialpurposesonly";
    ////////// WAY - 1
    // const existingUser = await prisma.user.findFirst({
    //     where:{
    //         address:hardcodedWalletAddress,
    //     }
    // })
    // if(existingUser) {
    //     const token = jwt.sign({
    //         userId: existingUser.id
    //     },JWT_SEC);
    //     res.json({token})
    // }else {
    //     const user = await prisma.user.create({
    //         data: {
    //             address: hardcodedWalletAddress
    //         }
    //     })
    //     const token = jwt.sign({
    //         userId: user.id
    //     },JWT_SEC);
    //     res.json({token})
    // }})
    ////////// WAY - 2
    const user = yield prisma.user.upsert({
        where: {
            address: hardcodedAddress2
        },
        update: {}, // if you dont have anything to update, u can keep it blank.
        create: {
            address: hardcodedAddress2,
        },
    });
    const token = jsonwebtoken_1.default.sign({
        userId: user.id
    }, JWT_SEC);
    res.json({ token });
}));
router.post("/task", middlewares_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    //@ts-ignore
    const user_id = req.userId;
    console.log("::::::::", user_id);
    const parsedData = types_1.createTaskInput.safeParse(body);
    if (!parsedData.success) {
        return res.status(411).json({
            msg: "Incorrect data type please check"
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
