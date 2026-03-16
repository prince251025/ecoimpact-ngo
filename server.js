const express = require("express")
const cors = require("cors")
const fs = require("fs")
const multer = require("multer")
const PDFDocument = require("pdfkit")
const path = require("path")

const app = express()

app.use(cors())
app.use(express.json())

// Serve frontend files
app.use(express.static(__dirname))
app.use("/uploads", express.static("uploads"))

const DB = "db.json"

// Ensure DB exists
if(!fs.existsSync(DB)){
fs.writeFileSync(DB, JSON.stringify({
users:[],
proofs:[],
campaigns:[],
gallery:[]
},null,2))
}

// Ensure uploads folder exists
if(!fs.existsSync("uploads")){
fs.mkdirSync("uploads")
}


// ==============================
// DATABASE FUNCTIONS
// ==============================

function readDB(){
try{
return JSON.parse(fs.readFileSync(DB))
}catch{
return {users:[],proofs:[],campaigns:[],gallery:[]}
}
}

function writeDB(data){
fs.writeFileSync(DB, JSON.stringify(data,null,2))
}


// ==============================
// USERS
// ==============================

app.get("/users",(req,res)=>{
const db=readDB()
res.json(db.users)
})


// ==============================
// LOGIN
// ==============================

app.post("/login",(req,res)=>{

const {email,password}=req.body
const db=readDB()

const user=db.users.find(
u=>u.email===email && u.password===password
)

if(!user){
return res.json({
success:false,
message:"Invalid credentials"
})
}

res.json({
success:true,
user
})

})


// ==============================
// REGISTER
// ==============================

app.post("/register",(req,res)=>{

const {email,password}=req.body
const db=readDB()

const existing=db.users.find(u=>u.email===email)

if(existing){
return res.json({
success:false,
message:"User already exists"
})
}

db.users.push({

id:Date.now(),
email,
password,
role:"volunteer",
points:0,
attendance:0,
badge:"Bronze 🥉",
history:[]

})

writeDB(db)

res.json({
success:true,
message:"Account created successfully"
})

})


// ==============================
// FILE UPLOAD
// ==============================

const storage = multer.diskStorage({

destination:"uploads/",

filename:(req,file,cb)=>{
cb(null,Date.now()+"-"+file.originalname)
}

})

const upload = multer({storage})


app.post("/upload", upload.single("image"), (req,res)=>{

const db=readDB()

db.proofs.push({

id:Date.now(),
email:req.body.email,
filename:req.file.filename,
status:"Pending"

})

writeDB(db)

res.json({success:true})

})


// ==============================
// GET PROOFS
// ==============================

app.get("/proofs",(req,res)=>{
const db=readDB()
res.json(db.proofs)
})


// ==============================
// APPROVE PROOF
// ==============================

app.post("/approve-proof",(req,res)=>{

const {id}=req.body
const db=readDB()

const proof=db.proofs.find(p=>p.id==id)

if(proof){

proof.status="Approved"

const user=db.users.find(u=>u.email===proof.email)

if(user){

user.points+=50

user.history.push({
type:"Proof Approved",
date:new Date()
})

}

}

writeDB(db)

res.json({success:true})

})


// ==============================
// REJECT PROOF
// ==============================

app.post("/reject-proof",(req,res)=>{

const {id}=req.body
const db=readDB()

const proof=db.proofs.find(p=>p.id==id)

if(proof){
proof.status="Rejected"
}

writeDB(db)

res.json({success:true})

})


// ==============================
// CAMPAIGNS
// ==============================

app.get("/campaigns",(req,res)=>{
const db=readDB()
res.json(db.campaigns || [])
})

app.post("/add-campaign",(req,res)=>{

const db=readDB()

db.campaigns.push({

id:Date.now(),
title:req.body.title,
description:req.body.description,
image:req.body.image

})

writeDB(db)

res.json({success:true})

})


// ==============================
// GALLERY
// ==============================

app.get("/gallery",(req,res)=>{
const db=readDB()
res.json(db.gallery || [])
})

app.post("/add-gallery",(req,res)=>{

const db=readDB()

db.gallery.push({

id:Date.now(),
image:req.body.image

})

writeDB(db)

res.json({success:true})

})

//////////////// ATTENDANCE //////////////////

// Punch In
app.post("/punch-in",(req,res)=>{

const {email} = req.body
const db = readDB()

const user = db.users.find(u=>u.email===email)

if(!user){
return res.json({success:false,message:"User not found"})
}

// prevent multiple punch-in same day
const today = new Date().toDateString()

const already = user.history.find(
h=>h.type==="Punch In" && new Date(h.date).toDateString()===today
)

if(already){
return res.json({success:false,message:"Already punched in today"})
}

user.attendance += 1

user.history.push({
type:"Punch In",
date:new Date()
})

writeDB(db)

res.json({
success:true,
message:"Attendance recorded ✅"
})

})


// Punch Out
app.post("/punch-out",(req,res)=>{

const {email} = req.body
const db = readDB()

const user = db.users.find(u=>u.email===email)

if(!user){
return res.json({success:false,message:"User not found"})
}

user.points += 10

user.history.push({
type:"Punch Out",
date:new Date()
})

writeDB(db)

res.json({
success:true,
message:"Good work today! +10 points 🌱"
})

})


// ==============================
// CERTIFICATE GENERATOR
// ==============================

app.get("/certificate/:email",(req,res)=>{

const email=req.params.email
const db=readDB()

const user=db.users.find(u=>u.email===email)

if(!user){
return res.send("User not found")
}

const doc=new PDFDocument({
layout:"landscape",
size:"A4"
})

res.setHeader(
"Content-Disposition",
"attachment; filename=certificate.pdf"
)

res.setHeader("Content-Type","application/pdf")

doc.pipe(res)

doc.image("assets/certificate.png",0,0,{
width:842
})

doc.fontSize(40)
.text(user.email,0,350,{align:"center"})

doc.fontSize(20)
.text("Impact Points: "+user.points,0,420,{align:"center"})

doc.text(
"Date: "+new Date().toLocaleDateString(),
0,
470,
{align:"center"}
)

doc.end()

})


// ==============================
// HOME ROUTE
// ==============================

app.get("/",(req,res)=>{
res.sendFile(path.join(__dirname,"login.html"))
})


// ==============================
// SERVER START
// ==============================

const PORT = process.env.PORT || 5000

app.listen(PORT,()=>{
console.log("EcoImpact Server Running on Port "+PORT)
})