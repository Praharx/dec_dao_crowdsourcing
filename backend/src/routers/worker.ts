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

router.post("/submission",WorkerMiddleware,async (req,res)=>{
    //@ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parsedBody = createSubmissionInput.safeParse(body);

    if(parsedBody.success){
        const task = await getNextTask(Number(userId));
        if(!task || task?.id !== Number(parsedBody.data.task_id)){
            return res.status(411).json({
                msg:"Incorrect task Id please check"
            })
        }
        let amount = (Number(task.amount)/MAX_SUBMISSIONS).toString();
        const submission = await prisma.submission.create({
            data:{
                option_id: Number(parsedBody.data?.selection),
                task_id: Number(parsedBody.data?.task_id),
                worker_id: userId,
                amount
            }
        });
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