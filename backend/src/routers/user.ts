import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import authMiddleware from "../middlewares";

const prisma = new PrismaClient();
const router = Router();
const JWT_SEC = process.env.JWT_SEC as string;
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID as string;
const ACCESS_KEY_PASSWORD = process.env.ACCESS_KEY_PASSWORD as string;
const s3Client = new S3Client(
    {
        credentials: {
            accessKeyId: ACCESS_KEY_ID,
            secretAccessKey: ACCESS_KEY_PASSWORD,
        },
        region: "eu-north-1"
    });

router.get("/preSignedUrl", authMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.userId;

    const { url, fields } = await createPresignedPost(s3Client, {
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

    console.log(url,fields);

    res.json({
        preSignedUrl : url,
        fields
    })
})


router.post("/signin", async (req, res) => {
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
    const user = await prisma.user.upsert({
        where: {
            address: hardcodedAddress2
        },
        update: {}, // if you dont have anything to update, u can keep it blank.
        create: {
            address: hardcodedAddress2,
        },
    });

    const token = jwt.sign({
        userId: user.id
    }, JWT_SEC);

    res.json({ token });

})

export default router;