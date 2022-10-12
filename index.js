const express =require('express')
const cors =require('cors')
const jwt = require('jsonwebtoken')
const dotEnv = require('dotenv').config()
const nodemailer =require('nodemailer')
const bcrypt = require('bcryptjs')
const mongodb =require('mongodb')
const mongoClient = mongodb.MongoClient;
const app =express()

const URL =process.env.DATAB
const DB ='urlshort'
app.use(express.json())
app.use(cors({
    origin:'*'
}))
app.post("/userpost",async function(req,res){
try {
    const connection = await mongoClient.connect(URL)
const db = connection.db(DB)
let uExist =await db.collection('users').findOne({email:req.body.email})
if(uExist){
  res.json({messege:'User already exists'})
}else{
    let salt = await bcrypt.genSalt(10)
    let hash = await bcrypt.hash(req.body.password,salt)
    req.body.activeStatus =false
    req.body.password=hash
    await db.collection('users').insertOne(req.body)
    let user = await db.collection('users').findOne({email:req.body.email})
    let token = jwt.sign({_id:user._id},process.env.JTOK)
    await db.collection('users').findOneAndUpdate({email:user.email},{$set:{token_id:token}})
    let sender = nodemailer.createTransport({
    
        service:'gmail',
      
        auth: {
           user: "valanrains@gmail.com",
           pass: `${process.env.MLC}`
        },
        debug: false,
        logger: true
    
       });
       let composeEmail={
        from:"valanrains@gmail.com",
        to:`${user.email}`,
        subject:"Activate your account by clicking the link",
        text:`Click the link to verify your account https://idyllic-cucurucho-e73381.netlify.app/activation?code=${token}`
       }
        sender.sendMail(composeEmail,(err)=>{
            if(err){
                console.log("Error found",err)
            }else{
                console.log("Mail sent")
            }
        })
    res.json({messege:"User updated and a mail have been sent to your mail id to activate your account"})
}

await connection.close()

} catch (error) {
    res.status(500).json({messege:'Internal server error'})
    console.log(error)
}



})

app.get('/token-verifi',async(req,res)=>{
try {
    const connection = await mongoClient.connect(URL);
const db =connection.db(DB);
let userD =await db.collection('users').findOne({token_id:req.headers.auth})
if(!userD.activeStatus){
    await db.collection('users').findOneAndUpdate({token_id:req.headers.auth},{$set:{activeStatus:true}})
    res.json({messege:'account activated'})
}else{
    res.json({messege:"your account is already activated"})
}
await connection.close()

} catch (error) {
    console.log(error)
    res.json({messege:'error'})
}
})
app.post('/loginc',async (req,res)=>{
    const connection =await mongoClient.connect(URL);
    const db = connection.db(DB);
 let sUser= await  db.collection('users').findOne({email:req.body.email})
 if(sUser){
    let compare = await bcrypt.compare(req.body.password,sUser.password);
    if(compare){
        let token = jwt.sign({_id:sUser._id},"df4r8f484edffwef",{expiresIn:'100m'})
        res.status(200).json({messege:"Verified sucessfully",code:sUser._id,token:token})
    }else{
        res.json({messege:'Username/password is invalid'})
    }
 }else{
    res.json({messege:'Username/password is invalid'})
 }
await connection.close();
})
let authenticate =(req,res,next)=>{
    let decode = jwt.verify(req.headers.auth,"df4r8f484edffwef")
    if(decode){
        
    next();
    }
    else if(!decode){
        res.status(401).json({messege:'Unauthorized'})
    }
}
let randomUrl=()=>{
    let randResult =''
    let chars="qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123654789"
    let charLen = chars.length
    for(let i=0;i<5;i++){
        randResult+=chars.charAt(
            Math.floor(Math.random()*charLen)
        )
    }
    return randResult;
}

app.post("/randurl",authenticate, async function(req,res){
 try {
    let shortUrl = randomUrl()
    const connection = await mongoClient.connect(URL)
    const db = connection.db(DB)
    req.body.createdby = mongodb.ObjectId(req.headers.userid)
    req.body.shorturl = shortUrl
    
    req.body.totalclick =0
    let findUrl = await db.collection('urlstore').findOne({urlValues:req.body.urlValues})
    if(findUrl){
        res.json({messege:"This url has already been shortned"})
    }else{
        await db.collection('urlstore').insertOne(req.body) 
        res.json({messege:"Short url created"})
    }
    
    await connection.close();
   
 } catch (error) {
    console.log(error)
 }
//   res.json({messege:"Done"})
//   console.log(req.body)
// console.log(randomUrl())
})
app.get('/allurl',authenticate,async (req,res)=>{
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB)
        let allUrl = await db.collection('urlstore').find().toArray()
        await connection.close();
        res.json({allUrl:allUrl})
    } catch (error) {
        console.log(error)
    }
})

app.get('/s/:magicurl', async (req,res)=>{
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB)
let reUrl = await db.collection('urlstore').findOne({shorturl:req.params.magicurl})

if(reUrl){
    await db.collection('urlstore').findOneAndUpdate({shorturl:req.params.magicurl},{$set:{totalclick:reUrl.totalclick+1}}) 
    res.redirect(`${reUrl.urlValues}`)
}else{
res.json({messege:"Create a short url first"})
}
await connection.close();
    } catch (error) {
        console.log(error)
    }
})
app.post("/passchange-mailverify", async function(req,res){
    try {
        const connection = await mongoClient.connect(URL);

    const db = connection.db(DB);

   let mail = await db.collection("users").findOne({email:req.body.email});
   
   

if(mail){

    let token = jwt.sign({_id:mail._id},process.env.JCODE)
    await db.collection("users").findOneAndUpdate({_id:mail._id},{$set:{token_id:token}})
   let sender = nodemailer.createTransport({
    
    service:'gmail',
  
    auth: {
       user: "valanrains@gmail.com",
       pass: `${process.env.MLC}`
    },
    debug: false,
    logger: true

   });
  
   let composeEmail={
    from:"valanrains@gmail.com",
    to:`${mail.email}`,
    subject:"Reseting the password",
    text:`https://idyllic-cucurucho-e73381.netlify.app/reset-pass?passveri=${token}`
   }
    sender.sendMail(composeEmail,(err)=>{
        if(err){
            console.log("Error found",err)
        }else{
            console.log("Mail sent")
        }
    })
    
    res.json({messege:"Email have been sent to your mail id"})
}else{
    res.json({messege:"User not found"})
}
await connection.close();
    } catch (error) {
        console.log(error)
        res.status(500).json({messege:"something went wrong"})

    }
    
    
});

app.get("/token/passwordchange",async function(req,res){
    try {
        let connection = await mongoClient.connect(URL)
let db = connection.db(DB)

let data = await db.collection("users").findOne({token_id:req.headers.authorization})

await connection.close()

if(data){
    
    res.json({token_id:data.token_id})
}
else{
    res.status(404).json({messege:"Not authorised"})
}
    
    } catch (error) {
        res.status(404).json({messege:"404 Not found"})
    }

});
app.put("/update", async function(req,res){
    try {
     const connection = await mongoClient.connect(URL);
     let db = connection.db(DB);
     let salt = await bcrypt.genSalt(10);
     let hash = await bcrypt.hash(req.body.password,salt);
     
   let updated =await  db.collection("userdet").findOneAndUpdate({token_id:req.headers.authorization},{$set:{password:hash}});
   if(updated){
     await db.collection('users').findOneAndUpdate({token_id:req.headers.authorization},{$unset:{token_id:""}})
   }
   await connection.close()
   res.json({messege:"done"})
    } catch (error) {
     console.log(error)
     res.json({messege:"something went down"})
    }
 
 })

app.listen(process.env.PORT || 3000)

