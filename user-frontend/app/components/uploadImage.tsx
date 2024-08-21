"use client"

import React, { useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;

interface UploadImageProps {
    images: string[];
    setImages: React.Dispatch<React.SetStateAction<string[]>>;
}

const UploadImage = ({images,setImages}:UploadImageProps) => {
    const [uploading, setUploading] = useState(false);

    async function chooseFile(e: React.ChangeEvent<HTMLInputElement>) {
        setUploading(true);

        try 
        {
            const response = await axios.get(`${BACKEND_URL}/v1/user/preSignedUrl`, {
                headers: {
                    Authorization: localStorage.getItem("token")
                }
            });
            console.log(response);
            const preSignedUrl = response.data.preSignedUrl;
            const file = e.target.files?.[0];
            
            if (!file) {
                console.error('No file selected');
                return;
            }
            
            const formData = new FormData();
            formData.set("bucket", response.data.fields["bucket"]);
            formData.set("X-Amz-Algorithm", response.data.fields["X-Amz-Algorithm"]);
            formData.set("X-Amz-Credential", response.data.fields["X-Amz-Credential"]);
            formData.set("X-Amz-Date", response.data.fields["X-Amz-Date"]);
            formData.set("key", response.data.fields["key"]);
            formData.set("Policy", response.data.fields["Policy"]);
            formData.set("X-Amz-Signature", response.data.fields["X-Amz-Signature"]);
            formData.set("Content-Type", response.data.fields["Content-Type"]);
            formData.append("file", file);
            
            console.log(preSignedUrl,"::::",formData);
            const res = await axios.post(preSignedUrl, formData);
            
            setImages((prevImages)=>[
                ...prevImages,
                `${CLOUDFRONT_URL}${response.data.fields.key}`
            ])
            console.log(images);
            setUploading(false)

        } catch (e) {
            console.log(e);
            setUploading(false);
        }
    }

    return <div>
        {images.length > 0 ? (
                <div className="flex flex-col items-center">
                    <ImageGrid images={images} />
                    <div className="h-24 w-24 border border-white rounded-lg flex justify-center items-center mx-auto relative p-4 mt-4">
                       { uploading?  <span className="text-sm">Uploading...</span>:<span className="text-2xl">+</span>}
                        <input
                            className="absolute h-full w-full top-0 right-0 left-0 bottom-0 opacity-0 cursor-pointer"
                            type="file"
                            onChange={(e) => chooseFile(e)}
                        />
                    </div>
                </div>
            ) :
                <div className="h-24 w-24 border border-white rounded-lg flex justify-center items-center mx-auto relative p-4">
                     { uploading?  <span className="text-sm">Uploading...</span>:<span className="text-2xl">+</span>}
                    <input
                        className="absolute h-full w-full top-0 right-0 left-0 bottom-0 opacity-0 cursor-pointer"
                        type="file"
                        onChange={(e) => chooseFile(e)}
                    />
                </div>
            }
    </div>
}



const ImageGrid= ({ images }:{images:string[]}) => {
    console.log(images)
    return (
        <div className="grid grid-cols-3 gap-4 p-4">
            {images.map((image, index) => (
                <div key={index} className="overflow-hidden rounded-lg shadow-lg">
                    <img src={image} alt={`Image ${index}`} className="w-full h-60 object-cover" />
                </div>
            ))}
        </div>
    );
};



export default UploadImage