import mongoose from "mongoose";

const connectionDB=async ()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to DB")
    }catch(err){
        console.log(err)
    }
}

export default connectionDB