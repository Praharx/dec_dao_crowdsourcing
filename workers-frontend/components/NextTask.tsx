"use client"

import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Task {
    id: number,
    title?:string,
    options:{
        id:number,
        image_url: string
        task_id:number,
    }[],
    amount: number
}

export default function NextTask() {
    
    const [taskDetails, setTaskDetails] = useState<Task|null>(null);
    const [loading, setLoading] = useState(false);

    async function onSelect(id:number){
        try{
            setLoading(true);
        const response = await axios.post(`http://localhost:3000/v1/worker/submission`,{
            task_id: String(taskDetails?.id),
            selection: String(id)
        },{
            headers: {
                Authorization: localStorage.getItem("token")
            } 
        });
        if(!response.data.nextTask){
            setTaskDetails(null);
        }
        setTaskDetails(response.data.nextTask);
        setLoading(false);
        }catch(e){
            console.log(e);
        }
    }

    async function fetchDetails() {
        try{
            const response = await axios.get(`${BACKEND_URL}/nextTask`, {
                headers: {
                    Authorization: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcyNDE2NDAxM30.YoazG67smWOT4L2ECnwplXo71Ht_OK4LmEDpVj16w2Q"
                }
                
            });
            return response.data;
        } catch(e){
            console.log(e);
        }
        
    }

    useEffect(() => {
        setLoading(true);
        try{
            fetchDetails().then((res) => {
                setTaskDetails(res.task);
                setLoading(false);
            });
        }catch(e){
            console.log(e);
        }
    }, []);

    if(taskDetails == null){
        return <div className="flex justify-center my-auto text-xl">Please come back later for more tasks:))</div>
    }

    return( 
        <div className="flex">
            {loading ? (
                <div>Loading....</div>
            ) : !taskDetails ? (
                <div>Please come back later and check</div>
            ) : (
                <div className="mt-20 flex flex-col justify-center items-center">
                    <div className="text-2xl font-mono mb-10">{taskDetails.title}</div>
                    <Grid items={taskDetails.options} onSelect={onSelect}/>
                </div>
            )}
        </div>
    );
}

const Grid = ({ items, onSelect }: {
    onSelect:(id:number) => void,
    items:{
    id: number;
    image_url: string;
    task_id: number;
    }[]   
}) => {
    return (
        <div className="grid grid-cols-3 gap-8 ml-96">
            {items.map((item, index) => (
                <div
                    key={index}
                    className=""
                >
                    <img 
                        onClick={() => onSelect(item.id)}
                        src={item.image_url}
                        alt={`Grid item ${index + 1}`}
                        className="w-full max-w-xs h-60 object-cover rounded-lg shadow-lg"
                    />
                </div>
            ))}
        </div>
    );
};
