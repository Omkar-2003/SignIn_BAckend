require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb+srv://omkar:OMKAR@cluster0.duiwp6o.mongodb.net/secret", {
  useNewUrlParser: true
});

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  secret: String
});
var arr=[];
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


//Before Sign in Person's data should present in USER collection , or else it will noot allow to sign you in (Person should register himself first)
//User collection will have all registered users
const User = new mongoose.model("User", userSchema);
//EmailUser collection will have user who has signed in via Google
const EmailUser = new mongoose.model("EmailUser", userSchema);



passport.use(EmailUser.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  EmailUser.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile,email, cb) {
    console.log(email);
    console.log(email.emails[0]);
    const data={
      email:email.emails[0].value
    }
    const value= data.email;

    //This Query check Does user is legit user or not
    User.findOne({email:value},function(err,user){

      if(err){
        console.log(err);
      }
      else{

      //This part of code  will check Does legit user has  signed in via google before
    EmailUser.findOne({email:value},function(err,founduser){
      if(err){
        console.log(err);
      }
      // If user is loged in via google first time , then store it information
      if(!founduser){
        const verified_user= new EmailUser({email:value});
        Everified_user.save();
          const data={
            data:verified_user,
            msg:"Verified user has been Successfully Log In First time !!"
          }
          console.log(data);
      }

      else{
        const data={
          data:value,
          msg:"Verified user has been Successfully Log In !!"
        }
        console.log(data);
      }
    });
      }
    });
}


));


//Google-oauth20 GET request
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile","email"] })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    const response={
      msg:"User data has been stored Successfully"
    }
    res.send(response);
    // Successful authentication, redirect to Next page .
  });




app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
