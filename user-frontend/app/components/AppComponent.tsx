"use client"

import {useState} from "react";
import UploadImage from "../components/uploadImage";
import axios from "axios";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function AppComponent(){
    const [title,setTitle] = useState("");
    const [images,setImages] = useState<string[]>([]);
    const router = useRouter();

    async function handleSubmit(){
        const modImages = images.map(img =>{
            return {
                imageUrl: img
            }
        });
        const response = await axios.post(`${BACKEND_URL}/v1/user/task`,{
            options: modImages,
            title: title,
            signature: "0x49820457576"
        },{
            headers: {
                Authorization: localStorage.getItem("token")
            }
        }); 
        if(!response) {
            alert("Task wasn't submitted!")
        };
        router.push(`/task/${response.data.id}`)
    }
    return <div className="flex flex-col pt-9 gap-2">
        <div className="mx-auto">
        <h1 className="text-[2rem]  font-mono">Confused about which YT video will perform better CTR wise?</h1>
        <h3 className="font-serif mb-3 text-center">Look no further, get reviews through ppl & enhance your video's CTR</h3>
        </div>
        <br />
        <h1 className="text-3xl  ml-44">Create Task</h1>
        
        <div className="ml-44 mt-1">
                <label htmlFor="taskTitle" className="block text-lg font-light">
                    Task Title:
                </label>
                <input
                    type="text"
                    id="taskTitle"
                    value={title}
                    onChange={(e)=> setTitle(e.target.value)}
                    className="mt-2 p-2 border rounded-md w-4/5 bg-zinc-800" 
                />
        </div>

        <div className="ml-44 mt-1 text-lg font-light mb-2">
            Add Images:
        </div>
 
        <UploadImage images={images} setImages={setImages}/>

        <button className="border border-white w-fit p-2 rounded-lg mx-auto mt-1 mb-10" onClick={handleSubmit}>Submit Task</button>
    </div>
}