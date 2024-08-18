import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getNextTask = async (userId:number) => {
    const task = await prisma.task.findFirst({
        where:{
            submissions: {
                none: {
                   worker_id:userId,
                }
            },
            done: false
        },
        select:{
            id:true,
            title:true,
            options:true,
            amount:true
        }
    })

    return task
}