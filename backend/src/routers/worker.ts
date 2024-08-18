import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import {WorkerMiddleware} from "../middlewares";

const router = Router();
const prisma = new PrismaClient();
const JWT_SEC_WORKER = process.env.JWT_SEC_WORKER as string;

router.post("submission",async (req,res)=>{
    
})

router.get("/nextTask",WorkerMiddleware,async (req,res)=>{
    //@ts-ignore
    const userId = req.userId;

    const task = await prisma.task.findFirst({
        where:{
            submissions: {
                none: {
                   worker_id: userId,
                }
            },
            done: false
        }
    })

    res.json({task})
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