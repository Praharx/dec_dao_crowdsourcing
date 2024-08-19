import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import {WorkerMiddleware} from "../middlewares";
import {getNextTask} from "../db"
import { createSubmissionInput } from "../types";

const router = Router();
const prisma = new PrismaClient();
const JWT_SEC_WORKER = process.env.JWT_SEC_WORKER as string;
const MAX_SUBMISSIONS = 100;
const TOTAL_DECIMALS = process.env.TOTAL_DECIMALS;
console.log(TOTAL_DECIMALS)

router.post("/payout",async(req,res)=>{
    //@ts-ignore
    const userId:string = req.userId;
    const worker = await prisma.worker.findFirst({
        where:{
            id:Number(userId)
        }
    })
})

router.get("/balance", WorkerMiddleware,async(req,res)=>{
    //@ts-ignore
    const userId:string = req.userId;

    const worker = await prisma.worker.findFirst({
        where:{
            id: Number(userId)
        }
    })

    res.json({
        pendingAmount: worker?.pending_amount,
        lockedAmount: worker?.locked_amount
    });
})

router.post("/submission",WorkerMiddleware,async (req,res)=>{
    //@ts-ignore
    const userId:string = req.userId;
    const body = req.body;
    const parsedBody = createSubmissionInput.safeParse(body);

    if(parsedBody.success){
        const task = await getNextTask(Number(userId));
        if(!task || task?.id !== Number(parsedBody.data.task_id)){
            return res.status(411).json({
                msg:"Incorrect task Id please check"
            })
        }

        const amount = task.amount/MAX_SUBMISSIONS;
        console.log(":::::",amount);

        const submission = await prisma.$transaction(async tx => {
            const submission = await tx.submission.create({
                data:{
                    option_id: Number(parsedBody.data?.selection),
                    task_id: Number(parsedBody.data?.task_id),
                    worker_id: Number(userId),
                    amount
                }
            });

            await tx.worker.update({
                where:{
                    id: Number(userId)
                },
                data:{
                    pending_amount:{
                        increment: amount 
                    }
                }
            })

            return submission;
        })
            

        
        const nextTask = await getNextTask(Number(userId));
        return res.json({
            nextTask,
            amount
        })
    }
})

router.get("/nextTask",WorkerMiddleware,async (req,res)=>{
    //@ts-ignore
    const userId:string = req.userId;

    const task = await getNextTask(Number(userId));

    if(!task){
        res.status(411).json(
           { msg:"No more tasks left for u to review."}
        )
    }else{
        res.status(400).json({
            task
        })
    }
})

router.post("/signin", async (req,res)=>{
    const hardcodedWalletAddress = "8BE2bhzokoZmuKscpNbAKGxHAQL5xSEhKnSHjgwpuowY";
    
    const user = await prisma.worker.upsert({
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

    const token = jwt.sign({
        userId: user.id
    }, JWT_SEC_WORKER);

    res.json({ token });
})

export default router;