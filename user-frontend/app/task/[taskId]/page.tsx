"use client"

import React, { useEffect } from "react";
import {useParams, useRouter} from "next/navigation";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function taskFunction(){
    const {taskId} = useParams();

    async function fetchDetails() {
        const response = await axios.get(`${BACKEND_URL}/`)
    }
    
    return <main className="flex flex-col min-h-screen bg-zinc-800">
        {taskId}
    </main>
}