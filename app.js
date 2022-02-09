const express=require("express");
const path=require("path");
const expresslayouts=require("express-ejs-layouts");
const mongoose=require("mongoose");
const bcrypt=require("bcryptjs");
const config=require("./config/database");
const session=require("express-session");
const passport=require("passport");
const {ensureAythenticated}=require("./config/auth");
const fs=require('fs');
const { Buffer } = require('buffer');
//console.log(Buffer);

//user array
const alluser=[];

function check(user){
	let dirname=path.join(__dirname.toString().replace(/\\/g,"/"),user);
	if(fs.existsSync(dirname)){
		return dirname;
	}
	else{
		fs.mkdir(dirname,{recursive:true},err=>{
			if(err) throw err;
		})
		return dirname;
	}
}

function basename(value){
	let nb=new Date();
	let time=Date.now();
	let date=nb.getDate();
	let mon=nb.getMonth();
	let year=nb.getYear();
	if(value=="Image"){
		let basename=`IMG-${time}-vi000${year}00${date}00${mon}.jpg`
		return basename;
	}
	if(value=="Audio"){
		let basename=`AUD-${time}-vi000${year}00${date}00${mon}.mp3`
		return basename;
	}
	if(valude="Video"){
		let basename=`VID-${time}-vi000${year}00${date}00${mon}.mp4`
		return basename;	
	}
}

function addchatlist(iduser,fromuser){
	let id={username:iduser};
		
}


mongoose.connect(config.database);
const db=mongoose.connection;



//check DB error
db.on("error",err=>console.log(err));

//check DB connection
db.once("open",()=>console.log("connection to the mongoDB"));

//ADD user
let User=require("./models/users")

//Express app
const app=express();

//add session
app.use(session({
	secret:"keyboard cat",
	resave:true,
	saveuninitialized:true
}))

//Load engine
app.use(expresslayouts)
app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");

//body parser
app.use(express.urlencoded({extened:false}));
app.use(express.json());


//static floder
app.use(express.static(path.join(__dirname,"public")));
console.log(__dirname);
//passport config
require("./config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session());

//Automsg
let usermsg="",b,target=null,storage=[];
let data={
	get usermsg(){
		if(storage.indexOf(target)<0){
			storage.push(target);
		}
		return usermsg;
	},
	set usermsg(Newvalue){
		usermsg=Newvalue;
		storage.forEach(sub=> sub());
	}
}
const autoreply=updatechat=>{
	function sub(){
		target=sub;
		updatechat();
		target=null;
	}
	sub();
}
autoreply(()=>{b=data.usermsg})

/*async function pro(){
	let arr=[];
	//const profile=await User.find({},{"picture":1}).exec();
	arr.push(await User.find({},{"picture":1}))
	console.log(arr);
    //Promise.all(arr).then(function (results) {
    //    console.log("sad",results);//result will be array which contains each promise response
    //})
	return arr;
}
//pro()
let ds=pro();
console.log("ff",ds);
*/
//Home route
app.get("/",(req,res)=>{
	User.find({},(err,user)=>{
		if(err){console.log(err)}
		else{
			res.render("home",{
				User:user,
				user:req.user
			});
		}
	})
	//console.log(alluser)
})


app.get("/login",(req,res)=>{

	console.log(Date());
	res.render("login",{
		title:"home"
	});
});

app.get("/logout",(req,res)=>{
	remove=alluser.find(user=>user.username=req.user.username)
	if(remove!==-1){
		alluser.splice(remove,1)
	}
	//console.log(alluser);
	req.logout();
	res.redirect('/login');

});

app.get("/register",(req,res)=>{
	res.render("register");
});

app.post("/search",async(req,res)=>{
	let payload= req.body.payload.trim();
	let search= await User.find({username:{$regex:new RegExp('^'+payload+'.*','i')}}).exec();
	search=search.slice(0,10);
	res.send({payload:search})
});
app.post("/searchlist",async(req,res)=>{
	let payload= req.body.payload.trim();
	let patten=new RegExp('^'+payload+'.*','i')
	console.log("casca",patten)
	let search= await req.user.chatlist.filter(user=> patten.test(user.username));
	console.log("serach",search)
	//search=search.slice(0,10);
	res.send({payload:search})
});

//REGISTER user
app.post("/register",(req,res)=>{
	let newuser=new User();
	newuser.firstname=req.body.firstname;
	newuser.lastname=req.body.lastname;
	newuser.username=req.body.username;
	newuser.gender=req.body.gender;
	newuser.phonenumber=req.body.phonenumber;
	newuser.Date_of_Birth={
		date:req.body.date,
		month:req.body.month,
		year:req.body.year
	};
	newuser.email=req.body.email;
	newuser.password=req.body.userpassword;
	User.findOne({email:newuser.email})
	.then(user=>{
		if(user){
			console.log("email already register!")
		}
		else{
			bcrypt.genSalt(10,(err,salt)=>{
				bcrypt.hash(newuser.password,salt,(err,hash)=>{
					if(err){
						console.log(err);
					}
					newuser.password=hash;
					newuser.save(err=>{
						if(err){
							console.log(err);
						}else{
							res.redirect("/login");
						}
					})
				})
			})
			newuser.save(err=>{
				if(err){
					console.log(err);
					return;
				}else{

				}
			})
		}
	})
});



app.post("/login",(req,res,next)=>{
	passport.authenticate("local",function(err,user,info){
		//successRedirect:"/",
		//failureRedirect:"/login",
		if(err){return next(err);}
		if(!user){console.log("incorrect");return res.send({msg:"incorrect emailid/password"});}
		req.logIn(user,(err)=>{
			if(err){return next(err);}
			return res.send({userid:user.username,onlineStatus:"green"});
			/******** error.problem:if we mension the 
			*two response or more then one,it's create the error like 
			*"can't send the response after set header",
			* ex.like:"res.send().redirect()" is not correct
			*res.status().send() is correct,because status mension the correct page status***/
		})
	})(req,res,next);
});

//forgetpassword
app.get("/forgetpassword",(req,res)=>{
	res.render("forgetpassword")
})
app.post('/verifyemail',async(req,res)=>{
	let verify_email=req.body.checkemail;
	if(!verify_email||verify_email==""){
		console.log("please enter the Email Id!");
		res.redirect('/forgetpassword');
	}
	else{
		let verifyuser=await User.findOne({email:verify_email}).lean();
		if(!verifyuser){
			console.log("something wrong,please check the Email ID");
			res.redirect("/forgetpassword")
		}
		else{
			data.usermsg=verifyuser;
			req.session.tempuser=verifyuser.email;
			console.log(req.session.tempuser)
			res.redirect("/change_password");
		}
	}
})

//changepassword
app.get("/change_password",(req,res)=>{
	console.log("b-:",b)
	res.render("change_password");
})

//new passwword change
app.post("/newpassword",(req,res)=>{
	console.log("b-:",b)
	let email=req.session.tempuser;
	let newpassword=req.body.newpassword;
	let conformpassword=req.body.conformpassword;
	console.log("new",newpassword);
	console.log("conform",conformpassword);
	if(newpassword==conformpassword){
		bcrypt.genSalt(10,(err,salt)=>{
			bcrypt.hash(newpassword,salt,(err,hash)=>{
				if(err){
					console.log(err);
				}
				newpassword=hash;
				console.log("hash",newpassword);
				User.update({email:email},{$set:{password:newpassword}},(err)=>{
					if(err){console.log(err);res.send("something is wrong,Try again")}
					console.log("done");
				})
				req.session.destroy(err=>{
					res.redirect("/login");
				});

			})
		})
	}
	else{
		console.log("password not match");
		res.redirect("/change_password");
	}
	//
})


app.get("/chat-list",async(req,res)=>{
	let profile=await User.find({},{"picture":1,"username":2}).exec();
	console.log(profile)
	User.find({},(err,user)=>{
		if(err){console.log(err)}
		else{
			res.render("chat_list",{
				user:req.user,
				profile:profile,
			});
		}
	})
})

//chatlist url route 
app.get("/chat-list/:id",async(req,res)=>{
	let profile=await User.find({},{"picture":1,"username":2}).exec();
	let id={_id:req.params.id}
	let menu=await User.find(id).exec();
	console.log("menu",menu)
	let chat_user=req.user.chatlist.find(user=>{if(user.username==menu[0].username) return user})
	res.render("chatbox",{
    	chatuser:menu[0],
    	usermsg:chat_user,
    	user:req.user,
    	profile:profile,
    	onlineStatus:alluser
	})
	/*-----same problem like proviews post("/logie")-----"can't send the response after set header"----
	res.render("chatbox",{
    	chatuser:menu[0],
    	usermsg:chat_user,
    	user:req.user,
	})*/ //this static render can't render in node
})

//collect the msg store the msg
app.post("/chat-list/chat/:id",(req,res)=>{
	let id={username:req.body.id,"chatlist.username":req.user.username};
	let cur_user={username:req.user.username,"chatlist.username":req.body.id};
	var len=0;
	User.findOne(cur_user,(err,user)=>{
		if(err){console.log("dwdq",err)}
		else{
			user["chatlist"].find((list)=>{
				if (list.username==req.body.id) {
					len += list.msg.length;
				}
			});
			//********* push msg in current user chatlist file ************
			User.findOneAndUpdate(cur_user,
				{$push:{
					"chatlist.$.msg":{id:len,formet:"Send",msgformet:"Sendtext",msgtext:req.body.text,Date:Date(),seen:false,seen_time:''}
					}
				},function(err,user){
				if (err) {console.log(err);}
				else{	
					console.log("sefefw",user)
					res.send({chatlist:"Msg send to"+`${req.body.id}`});
					// and set to store the user msg in reciver(user)
				}
			})

		}
	});
	let list={};
	list._id=req.user._id;
	list.username=req.user.username;
	list.msg=[{id:len,msgformet:"Receive",msgtext:req.body.text,Date:Date()}]
	User.findOneAndUpdate(id,
						{$addToSet:{
							"chatlist.$.msg":{id:len,formet:"Receive",msgformet:"Receivetext",msgtext:req.body.text,Date:Date(),seen:false}
						}
					},(err,user)=>{
		if (err) {console.log("fadf",err)}
		else{
			if(user===null){
				User.findOneAndUpdate({username:req.body.id},
						{$addToSet:{chatlist:[list]}
						},(err,asuser)=>{
							if (err) {console.log(err)}
							else{console.log("save")}
						}
					)
			}
		}
	})
})

//profile pic change
app.post('/upload',(req,res)=>{
	let chunk="";
	let dir="/public/image/"+req.user.username;
	let bnv="Image"
	let bn=basename(bnv);
	req.on("data",data=>{
		let Data=data.toString();
		chunk+=Data;
	})
	req.on("end",data=>{
		//console.log(chunk);
		let Data=chunk.replace(/^data:image\/\w+;base64,/g,"");
		let buf=Buffer.from(Data,"base64");
		fs.writeFile(check(dir)+"/"+bn,buf,(err)=>{
			if (err) throw err;
			console.log("image stored");
		})
		console.log(req.user.username)
		console.log(chunk.length);
		chunk="";
		console.log(chunk.length);
	})
	User.findOneAndUpdate({username:req.user.username},{
			$set:{"picture.profile":bn}
		},(err,user)=>{
			if(err){console.log(err)}
			else{console.log("uploaded!")}
		//console.log("uploaded!")
	})
	res.send({msg:"okk"});
	//????ge)
})


//chat image store

app.post('/chat/image',(req,res)=>{
	let chunk="";
	let dirSend="/public/image/"+req.user.username+"/send";
	let bnv="Image"
	let bn=basename(bnv);
	req.on("data",data=>{
		let Data=data.toString();
		chunk+=Data;
	})
	req.on("end",data=>{
		//console.log(chunk);
		chunk=JSON.parse(chunk);
		console.log("jsonchunk",chunk.id)
		let dirReceive="/public/image/"+chunk.id+"/send";
		let Data=chunk.img.replace(/^data:image\/\w+;base64,/g,"");
		let buf=Buffer.from(Data,"base64");

		fs.writeFile(check(dirSend)+"/"+bn,buf,(err)=>{
			if (err) throw err;
			console.log("image stored");
		});


		let imagetext=JSON.stringify({image:bn,text:chunk.text});
		console.log(imagetext);
		User.findOneAndUpdate({username:req.user.username,"chatlist.username":chunk.id},
			{$push:{
				"chatlist.$.msg":{
					id:0,formet:"Send",msgformet:"Sendimage",msgtext:imagetext,Date:Date(),seen:false,seen_time:''}
				}
			},(err)=>{
			if(err){console.log("err",err)}
			else{
				console.log("uploaded!1");

			}
		//console.log("uploaded!")
		})

		fs.writeFile(check(dirReceive)+"/"+bn,buf,(err)=>{
			if (err) throw err;
			console.log("image stored");
		});

		User.findOneAndUpdate({username:chunk.id,"chatlist.username":req.user.username},
			{$addToSet:{
				"chatlist.$.msg":{id:0,msgformet:"Receiveimage",msgtext:imagetext,Date:Date(),seen:false,seen_time:''}
				}
			},(err,user)=>{
			if(err){console.log(err)}
			else{
				console.log("uploaded!");
			}

		//console.log("uploaded!")
		})
		chunk="";
		console.log(req.user.username);
		console.log(chunk.length);
		
		console.log(chunk.length)
	})


	res.send({msg:"okk"});
	//????ge)
})

app.post('/chat/video',(req,res)=>{
	let chunk="";
	let dirSend="/public/image/"+req.user.username+"/send/video";
	let bnv="Video"
	let bn=basename(bnv);
	req.on("data",data=>{
		let Data=data.toString();
		chunk+=Data;
	})
	req.on("end",data=>{
		//console.log(chunk);
		chunk=JSON.parse(chunk);
		console.log("jsonchunk",chunk.id)
		let dirReceive="/public/image/"+chunk.id+"/send/video";
		let Data=chunk.video.replace(/^data:video\/\w+;base64,/g,"");
		let buf=Buffer.from(Data,"base64");

		fs.writeFile(check(dirSend)+"/"+bn,buf,(err)=>{
			if (err) throw err;
			console.log("video stored");
		});


		let videotext=JSON.stringify({video:bn,text:chunk.text});
		//console.log(imagetext);
		User.findOneAndUpdate({username:req.user.username,"chatlist.username":chunk.id},
			{$push:{
				"chatlist.$.msg":{
					id:0,formet:"Send",msgformet:"Sendvideo",msgtext:videotext,Date:Date(),seen:false,seen_time:''}
				}
			},(err)=>{
			if(err){console.log("err",err)}
			else{
				console.log("uploaded!1");

			}
		//console.log("uploaded!")
		})

		fs.writeFile(check(dirReceive)+"/"+bn,buf,(err)=>{
			if (err) throw err;
			console.log("video1 stored");
		});

		User.findOneAndUpdate({username:chunk.id,"chatlist.username":req.user.username},
			{$addToSet:{
				"chatlist.$.msg":{id:0,msgformet:"Receivevideo",msgtext:videotext,Date:Date(),seen:false,seen_time:''}
				}
			},(err,user)=>{
			if(err){console.log(err)}
			else{
				console.log("uploaded!");
			}

		//console.log("uploaded!")
		})
		chunk="";
		console.log(req.user.username);
		console.log(chunk.length);
		
		console.log(chunk.length)
	})


	res.send({msg:"okk"});
	//????ge)
})

app.post('/chat/audio',(req,res)=>{
	let chunk="";
	let dirSend="/public/image/"+req.user.username+"/audiochat";
	let bnv="Audio"
	let bn=basename(bnv);
	req.on("data",data=>{
		let Data=data.toString();
		chunk+=Data;
	})
	req.on("end",data=>{
		//console.log(chunk);
		chunk=JSON.parse(chunk);
		console.log("jsonchunk",chunk.id)
		let dirReceive="/public/image/"+chunk.id+"/audiochat";
		let Data=chunk.audio.replace(/^data:audio\/\w+;base64,/g,"");
		let buf=Buffer.from(Data,"base64");

		fs.writeFile(check(dirSend)+"/"+bn,buf,(err)=>{
			if (err) throw err;
			console.log("image stored");
		});

		User.findOneAndUpdate({username:req.user.username,"chatlist.username":chunk.id},
			{$push:{
				"chatlist.$.msg":{
					id:0,formet:"Send",msgformet:"Sendaudio",msgtext:bn,Date:Date(),seen:false,seen_time:''}
				}
			},(err)=>{
			if(err){console.log("err",err)}
			else{
				console.log("uploaded!1");

			}
		//console.log("uploaded!")
		})

		fs.writeFile(check(dirReceive)+"/"+bn,buf,(err)=>{
			if (err) throw err;
			console.log("image stored");
		});

		User.findOneAndUpdate({username:chunk.id,"chatlist.username":req.user.username},
			{$addToSet:{
				"chatlist.$.msg":{id:0,formet:"Receive",msgformet:"Receiveaudio",msgtext:bn,Date:Date(),seen:false,seen_time:''}
				}
			},(err,user)=>{
			if(err){console.log(err)}
			else{
				console.log("uploaded!");
			}

		//console.log("uploaded!")
		})
		chunk="";
		console.log(req.user.username);
		console.log(chunk.length);
		
		console.log(chunk.length)
	})


	res.send({msg:"okk"});
	//????ge)
})


app.post('/chat/seen',(req,res)=>{
	console.log("seen",req.body.fromuser)
	let user={username:req.body.fromuser}
	let touser={username:req.body.touser}
	console.log(touser,user)
	User.update(touser,
		{$set:{

			"chatlist.$[element].msg.$[ele].seen":true,
			"chatlist.$[element].msg.$[ele].seen_time":Date()

			}
		},
		{"arrayFilters":
		[
			{"element.username":`${req.body.fromuser}`},

			{
				"ele.formet":"Send",
				"ele.seen":false
			}
		]
		},
		(err,USER)=>{
				if(err) throw err;
				console.log("update seen in touser");
		})

		/*let msglist=USER[0]["chatlist"].find(list=>{if(list.username==req.body.fromuser){return list}})
		//console.log("serert",msglist)
		for(let j=0;j<msglist.msg.length;j++){
			/* be careful with what you think and what are you doing,
			because,lot of silly mistake make the trouble thing,/
			let msgprop=msglist.msg[j];
			console.log("seen that shit!",msgprop['msgformet'],msgprop['seen'])
			if(msgprop['msgformet']=="Send" && msgprop['seen']==false){
				console.log("the msg seen_time")
				msgprop.seen==true;
				msgprop.seen_time==Date()
				USER.save(function(err){
					if(err) throw err;
					console.log("update seen in touser")
				})
			}
		}*/

	//})
	User.update(user,{
		$set:{"chatlist.$[element].msg.$[ele].seen":true}},
		{"arrayFilters":[
				{
					"element.username":`${req.body.touser}`
				},
				{
					"ele.formet":"Receive",
					"ele.seen":false
				}
			]},(err,USER)=>{
				if(err) throw err;
				console.log("update seen in touser")
	})
	res.send({msg:"seen the msg"})
})

app.post("/:id",async(req,res)=>{
	let id={username:req.body.id};
	let cur_user={username:req.user.username};
	let check_list=await User.find(cur_user).exec();
	console.log("edqeqd",check_list)
	let user=check_list[0].chatlist.findIndex((list)=>list.username==req.body.id)
	console.log("asdasdad",user)
	if(id.username===cur_user.username){
		console.log("same id")
		res.send({user:"same id"})
	}
	else if(user!==-1){
		console.log("already in list")
		res.send({user:"already in list"})
	}else{
		User.findOne(id,(err,user)=>{
			if (err) {console.log(err)}
			else{{
				let list={};
				list._id=user._id;
				list.username=user.username;
				User.findOneAndUpdate(cur_user,
					{$addToSet:{
						chatlist:[list]
						}
					},function(err,user){
					if (err) {console.log(err);return;}
					else{
						console.log(user["chatlist"]);
						res.send({user:user["chatlist"]})
					}
				});
			}}
		})
	}
	
})




//User profile
app.get("/userprofile",(req,res)=>{
	res.render("userprofile",{
		user:req.user
	});
})

//Set port
const port=process.env.port||8020;
const server=app.listen(port,()=> console.log(`Connected on port ${port}`))

const clients=[];
const usertyping=(chech_userid,ws)=>{
	if(chech_userid==-1){
		console.log("oops!.user not in list!")
	}
	else{
		console.log("faffa",ws.tyinginfo.typingstatus)
		alluser[chech_userid].send(JSON.stringify({
			events:"user-tying",
			data:{
				from:ws.info.userid,
				typing:ws.tyinginfo.typingstatus,
				to:ws.tyinginfo.tyingto,
				status:ws.info.onlineStatus

			}
		}))
	}
}

const WebSocket=require('ws');
const wss= new WebSocket.Server({
		noServer:true
})




let receivemsg={
	from_user:"",
	msg:"",
	to_user:""
};

let receivemedia={
	source:"",
	msg:"",
	to_user:"",
	from_user:"",
	type:""
};



function updateAlluser(ws){
	alluser.forEach(client=>{
		if(client.readyState===WebSocket.OPEN){
			console.log("asd",client.info)
			client.send(JSON.stringify({
				events:"all-user",
				data:alluser.map(userws=>({
					status:userws.info.onlineStatus,
					userid:userws.info.userid
				}))
			}))
		}
	})
}

function mediasend(data){
	let sendto=alluser.findIndex(client=>{return client.info.userid==data.to && client.readyState===WebSocket.OPEN})
	alluser[sendto].receive.push(data);
	let event="";
	switch(data.type){
		case"image":{
			event="new-message_IMG"
			break
		}
		case"audio":{
			event="new-message_AUD"
			break
		}
		case"video":{
			event="new-message_VID"
			break
		}
	}

	alluser[sendto].send(JSON.stringify({
		events:event,
		data:{
			msg:alluser[sendto].receive[alluser[sendto].receive.length-1]

		}
	}))
	console.log(alluser[sendto].receive[alluser[sendto].receive.length-1])	
}

wss.on("connection",ws=>{
	//console.log(ws.info)
	//clients.push(ws)
	ws.info={
		onlineStatus:"green",
		userid:'no_user',
	}
	ws.receive=[]
	ws.tyinginfo={
		typingstatus:false,
		tyingto:''
	}
	ws.image=[]
	ws.on("message",msg=>{
		
		try{
			const {event,data}=JSON.parse(msg);
			//console.log({event,data});
			switch(event){
				case"addTypinguser":{
					ws.tyinginfo=data;
					console.log("tying",ws.tyinginfo);
					let chech_userid=alluser.findIndex(clients=> clients.info.userid==ws.tyinginfo.tyingto );
					console.log(chech_userid)
					usertyping(chech_userid,ws);
					break;
				}
				case"removeTypingUsers":{
					let chech_userid=alluser.findIndex(clients=> clients.info.userid==ws.tyinginfo.tyingto );
					ws.tyinginfo=data;
					usertyping(chech_userid,ws);
					console.log("leave",ws.tyinginfo)
					break;
				}
				case"thisuser":{
					ws.info=data;
					let chech_userid=alluser.findIndex(clients=> clients.info.userid==ws.info.userid );
					console.log("sdfa",chech_userid)
					if(chech_userid!==-1){
						alluser[chech_userid]=ws
						console.log("done")
					}
					else alluser.push(ws);
					updateAlluser(ws);
					break;
				}
				case"sendimagert":{
					receivemedia=data;
					//console.log("value",value);
					mediasend(receivemedia);
					/*fs.writeFile(__dirname,"public/test.png",data,err=>{
						if (err){"something wrong"}
						else {"image stored"}
					})*/
					//console.log("dsdsdasda",value.toString())
					//let ReadStream=fs.createReadStream(value);
					//console.log("readstream",ReadStream);
					//ws.image.push(value);
					//console.log(alluser[sendto].receive[alluser[sendto].receive.length-1])
					break
				}
				case"sendaudiort":{
					receivemedia=data;
					//console.log("fdd",receivemedia)
					mediasend(receivemedia);
					break;
					//console.log("value",value);
				}
				case"sendvideort":{
					receivemedia=data;
					//console.log("fdd",receivemedia)
					mediasend(receivemedia);
					break;
					//console.log("value",value);
				}
				case"Send":{
					receivemsg=data;
					let sendto=alluser.findIndex(client=>{return client.info.userid==data.to_user && client.readyState===WebSocket.OPEN})
					console.log(sendto)
					ws.tyinginfo={typingstatus:false,to:""}
					usertyping(sendto,ws)
					alluser[sendto].receive.push(receivemsg);

					alluser[sendto].send(JSON.stringify({
						events:"new-message",
						data:{
							msg:alluser[sendto].receive[alluser[sendto].receive.length-1]

						}
					}))
					console.log(alluser[sendto].receive[alluser[sendto].receive.length-1])
					break;
				}
				case"updateuserstatus":{
					ws.info.onlineStatus=data;
					updateAlluser(ws);
					break;
				}
			}
		}
		catch(err){
			console.log(err);
		}
		/*clients.forEach(function each(client){
			if(client.readyState === WebSocket.OPEN){
				client.send(`${data}`);
			}
		})
		console.log("data",`${data}`)*/
	})
})

server.on("upgrade",function update(request,socket,head){
	wss.handleUpgrade(request,socket,head,function done(ws){
		wss.emit("connection",ws,request)
	})
})