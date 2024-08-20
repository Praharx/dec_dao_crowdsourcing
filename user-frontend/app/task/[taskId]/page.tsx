"use client"

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Appbar from "@/components/Appbar";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function taskFunction() {
    const { taskId } = useParams();
    const [result, setResult] = useState<Record<string, {
        count: number,
        option: {
            imageUrl: string
        }
    }>
    >({});
    const [taskDetails, setTaskDetails] = useState<{ title?: string }>({});

    async function fetchDetails() {
        const response = await axios.get(`${BACKEND_URL}/v1/user/task?taskId=${taskId}`, {
            headers: {
                Authorization: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcyNDExOTg3NH0.g0H_URzXL6MNid7eceNQsefCxleYcqzqqMnOi7D9J8E"
            }
        });
        console.log(response);
        return response.data
    }

    useEffect(() => {
        fetchDetails().then((res) => {
            setResult(res.result);
            setTaskDetails(res.taskDetails);
        })
    }, [taskId]);

    return <main className="flex flex-col min-h-screen bg-zinc-800 mx-auto">
        <Appbar />
        {taskDetails ? <div className="text-2xl font-serif text-center mt-10">{taskDetails?.title}</div> :
            <div className="text-3xl font-serif mt-10">TASK ID doesn't exist</div>}
        <div className="grid grid-flow-col gap-4 mx-auto max-w-screen-lg mt-10">
            {Object.keys(result).map((key) => (
                <div key={key} className="flex flex-col items-center mb-4">
                    <span className="text-white mb-2">Count: {result[key].count}</span>
                    <img
                        src={result[key].option.imageUrl}
                        alt="img"
                        className="w-full max-w-xs h-60 object-cover rounded-lg shadow-lg"
                    />
                </div>
            ))}
        </div>
    </main>
}

