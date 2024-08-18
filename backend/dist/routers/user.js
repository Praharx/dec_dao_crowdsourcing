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
const middlewares_1 = __importDefault(require("../middlewares"));
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const JWT_SEC = process.env.JWT_SEC;
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const ACCESS_KEY_PASSWORD = process.env.ACCESS_KEY_PASSWORD;
const s3Client = new client_s3_1.S3Client({
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: ACCESS_KEY_PASSWORD,
    },
    region: "eu-north-1"
});
// router.get("/preSignedUrl", authMiddleware, async (req, res) => {
//     //@ts-ignore
//     const userId = req.userId;
//     const { url, fields } = await createPresignedPost(s3Client, {
//         Bucket: 'decentralised-dao-labour',
//         Key: `/uploads/${userId}/${Math.random()}/image.jpg`,
//         Conditions: [
//             ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
//         ],
//         Fields: {
//             'Content-Type': 'image/jpg'
//         }, 
//         Expires: 3600
//     })
//     console.log(url,fields);
//     res.json({
//         preSignedUrl : url,
//         fields
//     })
// })
router.get("/preSignedUrl", middlewares_1.default, (req, res) => {
    //@ts-ignore
    const userId = req.userId;
    new Promise((resolve, reject) => {
        (0, s3_presigned_post_1.createPresignedPost)(s3Client, {
            Bucket: 'decentralised-dao-labour',
            Key: `/uploads/${userId}/${Math.random()}/image.jpg`,
            Conditions: [
                ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
            ],
            Fields: {
                'Content-Type': 'image/jpg'
            },
            Expires: 3600
        })
            .then(({ url, fields }) => {
            console.log(url, fields);
            resolve({ url, fields });
        })
            .catch(error => {
            reject(error);
        });
    })
        .then(({ url, fields }) => {
        res.json({
            preSignedUrl: url,
            fields
        });
    })
        .catch(error => {
        console.error("Error creating presigned URL:", error);
        res.status(500).json({ error: "Failed to create presigned URL" });
    });
});
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
exports.default = router;
