import { NextFunction,Request,Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SEC = process.env.JWT_SEC as string;
const JWT_SEC_WORKER = process.env.JWT_SEC_WORKER as string;

export function authMiddleware(req:Request,res:Response,next:NextFunction){
    const authHeader = req.headers["authorization"] ?? ""; // ?? used to define if the first thing is null use the value on right.

    try{
        const decoded = jwt.verify(authHeader,JWT_SEC);
        //@ts-ignore
        if(decoded.userId){
            //@ts-ignore
            req.userId = decoded.userId;
            console.log("middleware job done.")
            return next();
        } else{
            return res.status(403).json({
                message:"You're not logged in."
            })
        }
    }catch(e){
        return res.status(403).json({
            message:"You're not logged in."
        })
    }
}

export  function WorkerMiddleware(req:Request,res:Response,next:NextFunction){
    const authHeader = req.headers["authorization"] ?? ""; // ?? used to define if the first thing is null use the value on right.

    try{
        const decoded = jwt.verify(authHeader,JWT_SEC_WORKER);
        //@ts-ignore
        if(decoded.userId){
            //@ts-ignore
            req.userId = decoded.userId;
            return next();
        } else{
            return res.status(403).json({
                message:"You're not logged in."
            })
        }
    }catch(e){
        return res.status(403).json({
            message:"You're not logged in."
        })
    }
}