import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const router = Router();
const JWT_SEC = "hasu123";

router.post("/signin",async (req,res)=>{
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
        where:{
            address: hardcodedAddress2
        },
        update:{}, // if you dont have anything to update, u can keep it blank.
        create:{
            address:  hardcodedAddress2,
        },
    });

    const token = jwt.sign({
        userId:user.id
    },JWT_SEC);
    
    res.json({token});
    
})

export default router;