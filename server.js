const express = require("express")
const cors = require("cors")
const fs = require("fs")
const multer = require("multer")
const PDFDocument = require("pdfkit")

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.static(__dirname))
app.use("/uploads", express.static("uploads"))

const DB = "db.json"

function readDB(){
return JSON.parse(fs.readFileSync(DB))
}

function writeDB(data){
fs.writeFileSync(DB, JSON.stringify(data,null,2))
}

//////////////// USERS //////////////////

app.get("/users",(req,res)=>{
const db=readDB()
res.json(db.users)
})

//////////////// LOGIN //////////////////

app.post("/login",(req,res)=>{

const {email,password}=req.body
const db=readDB()

const user=db.users.find(
u=>u.email===email && u.password===password
)

if(!user){
return res.json({success:false})
}

res.json({success:true,user})

})

//////////////// REGISTER //////////////////

app.post("/register",(req,res)=>{

const {email,password}=req.body
const db=readDB()

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

res.json({success:true})

})

//////////////// FILE UPLOAD //////////////////

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

//////////////// GET PROOFS //////////////////

app.get("/proofs",(req,res)=>{
const db=readDB()
res.json(db.proofs)
})

//////////////// APPROVE //////////////////

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

//////////////// REJECT //////////////////

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

//////////////// CAMPAIGNS //////////////////

app.get("/campaigns",(req,res)=>{
const db=readDB()
res.json(db.campaigns || [])
})

app.post("/add-campaign",(req,res)=>{

const db=readDB()

if(!db.campaigns) db.campaigns=[]

db.campaigns.push({
id:Date.now(),
title:req.body.title,
description:req.body.description,
image:req.body.image
})

writeDB(db)

res.json({success:true})

})

//////////////// GALLERY //////////////////

app.get("/gallery",(req,res)=>{
const db=readDB()
res.json(db.gallery || [])
})

app.post("/add-gallery",(req,res)=>{

const db=readDB()

if(!db.gallery) db.gallery=[]

db.gallery.push({
id:Date.now(),
image:req.body.image
})

writeDB(db)

res.json({success:true})

})

//////////////// CERTIFICATE //////////////////

app.get("/certificate/:email",(req,res)=>{

const email = req.params.email
const db = readDB()

const user = db.users.find(u=>u.email === email)

if(!user){
return res.send("User not found")
}

const doc = new PDFDocument({
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

//////////////// START //////////////////
app.get("/", (req,res)=>{
res.sendFile(__dirname + "/login.html")
})

app.listen(5000,()=>{
console.log("Server running on http://localhost:5000")
})