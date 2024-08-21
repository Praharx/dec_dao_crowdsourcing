import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import nacl from "tweetnacl";
import jwt from "jsonwebtoken";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import {authMiddleware} from "../middlewares";
import { createTaskInput } from "../types";
import { Connection, PublicKey } from "@solana/web3.js";


const prisma = new PrismaClient();
const router = Router();
const JWT_SEC = process.env.JWT_SEC as string;
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID as string;
const ACCESS_KEY_PASSWORD = process.env.ACCESS_KEY_PASSWORD as string;
const DEFAULT_TITLE = "Select the most clickable thumbnail.";
const PARENT_WALLET_ADDRESS = "8BE2bhzokoZmuKscpNbAKGxHAQL5xSEhKnSHjgwpuowY";
const connection = new Connection("https://solana-devnet.g.alchemy.com/v2/mSOKolKC5DWNK9KeMWIEoN9TxSNWspzy");
const s3Client = new S3Client(
    {
        credentials: {
            accessKeyId: ACCESS_KEY_ID,
            secretAccessKey: ACCESS_KEY_PASSWORD,
        },
        region: "eu-north-1"
    });

router.get("/task", authMiddleware, async(req,res)=>{
    //@ts-ignore
    const taskId: string = req.query.taskId;
    //@ts-ignore
    const userId = req.userId;

    const taskDetails = await prisma.task.findFirst({
        where:{
            id:Number(taskId),
            user_id: userId
        },
        include:{
            options:true
        }
    })

    if(!taskDetails){
        return res.status(411).json({
            msg:"The given task_id doesn't exist on the user_id."
        })
    }

    const responses = await prisma.submission.findMany({
        where:{
            task_id: Number(taskId)
        },
        include:{
            option:true
        }
    })

    const result: Record<string,{
        count:number,
        option: {
            imageUrl: string
        }}> = {};

    taskDetails.options.forEach(option => {
        result[option.id] = {
            count: 1,
            option: {
                imageUrl: option.image_url
            }
        }
    })
    
    responses.forEach(r => {
        result[r.option_id].count++;
    })

    res.json({
        result,
        taskDetails
    })

})

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

    res.json({
        preSignedUrl : url,
        fields
    })
})


router.post("/signin", async (req, res) => {
    const {signature, publicKey} = req.body;
  
    try{
        
        const sign = new Uint8Array(signature.data);
        console.log("Signature Length backend:", sign.length);
        const message = new TextEncoder().encode("You have signed-in to Crowd Source.");

    const result = nacl.sign.detached.verify(
        message,
        sign,
        new PublicKey(publicKey).toBytes(),

    
    );
  
    if (!result) {
        return res.status(402).json({
            msg:"no result received."
        })
    }
    } catch(e) {
        console.log(e);
        return res.status(400).json({
            msg: "internal server error"
        })
    }


    

    const user = await prisma.user.upsert({
        where: {
            address:publicKey
        },
        update: {}, // if you dont have anything to update, u can keep it blank.
        create: {
            address: publicKey,
        },
    });

    const token = jwt.sign({
        userId: user.id
    }, JWT_SEC);

    res.json({ token });

})

router.post("/task", authMiddleware,async (req,res)=>{
    const body = req.body;
    //@ts-ignore
    const user_id = req.userId;

    const parsedData = createTaskInput.safeParse(body);

    if(!parsedData.success) {
        return res.status(411).json({
            msg: "Incorrect data type please check"
        })
    }

    console.log("signature",parsedData.data.signature);
    // VERIFICATION IS YET NOT DONE
    // const transaction = await connection.getTransaction(parsedData.data.signature,{
    //     maxSupportedTransactionVersion: 1
    // })

    // console.log(transaction);

    // if((transaction?.meta?.postBalances[1] ?? 0) - (transaction?.meta?.preBalances[1] ?? 0) !== 100000000 ){
    //     return res.status(411).json({
    //         message:"Transaction signature/amount increment."
    //     })
    // }

    // if(transaction?.transaction.message.getAccountKeys().get(1)?.toString() !== PARENT_WALLET_ADDRESS){
    //     return res.status(411).json({
    //         message:"Transaction sent to wrong address."
    //     })
    // }

    // parsing the signature over here to verfiy the amount paid.

    let response = await prisma.$transaction(async tx =>{
        const response = await tx.task.create({
            data:{
                title: parsedData.data.title ?? DEFAULT_TITLE,
                amount: 1 ,
                signature: parsedData.data.signature,
                user_id: user_id
            }
        });
        

        await tx.option.createMany({
            data: parsedData.data.options.map(x => ({
                image_url: x.imageUrl,
                task_id: response.id
            }))
        })

        return response;
    })

    res.json({
        id: response.id
    })
});

export default router;