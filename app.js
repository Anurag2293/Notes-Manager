
// IMPORTS/REQUIREMENTS
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

const app = express();

//  MIDDLEWARE
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// DATABASE
mongoose.connect("mongodb://localhost:27017/notesDB");

const notesSchema = new mongoose.Schema({
    noteID: String, // Username
    topic: String,
    content: String
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: function () {
            return this.username ? true : false
        }
    }
});

const User = mongoose.model("User", userSchema);
const Note = mongoose.model("Note", notesSchema);

// REQUEST
app.get("/", (req, res) => {
    res.render("home", {
        success: ''
    });
});

app.get("/register", (req, res) => {
    res.render("register", {
        sameUsername: ''
    });
});

app.get("/login", (req, res) => {
    res.render("login", {
        loginStatus: ''
    });
});

app.post("/register", (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, (hashError, hash)=>{
        User.findOne({ username: req.body.username }, (findError, foundUser) => {
            if (findError) {
                console.log(findError);
            } else {
                if (foundUser) {
                    res.render("register", {
                        sameUsername: "This username already exist. Try another or contact the owner if there is any problem."
                    });
                } else {
                    const newUser = new User({
                        username: req.body.username,
                        password: hash,
                    });
                    newUser.save((saveError) => {
                        if (saveError) {
                            console.log(saveError);
                        } else {
                            res.render("home", {
                                success: "Successfully registered."
                            });
                        }
                    });
                }
            }
        });
    });    
});

app.post("/login", (req, res) => {
    const enteredUsername = req.body.username;
    const enteredPassword = req.body.password;
    User.findOne({ username: enteredUsername }, (userFoundError, foundUser) => {
        if (userFoundError) {
            console.log(userFoundError);
            res.render("login", {
                loginStatus: "There was some error.😐 Try again!"
            });
        } else {
            if (foundUser) {
                bcrypt.compare(enteredPassword, foundUser.password, (compareError, result)=>{
                    if(result === true){
                        Note.find({noteID: enteredUsername}, (noteFoundError, foundNotes) => {
                            if (noteFoundError) {
                                console.log(noteFoundError);
                            } else {
                                res.render("notes", {
                                    username: req.body.username,
                                    notes: foundNotes
                                });
                            }
                        });
                    } else {
                        res.render("login", {
                            loginStatus: "Wrong Password.🤨 Try Again."
                        });
                    }
                });
            } else {
                res.render("login", {
                    loginStatus: "No such user found.😕"
                });
            }
        }
    });
});

app.post("/notes", (req, res) => {
    let newNote = new Note({
        noteID: req.body.username,
        topic: req.body.topic,
        content: req.body.content
    });
    newNote.save((saveError) => {
        if (saveError) {
            console.log(saveError);
        } else{
            User.find({username: req.body.username}, (err, foundUser)=>{
                if(err){
                    console.log(err);
                }else{
                    Note.find({noteID: req.body.username}, (noteFindError, foundNotes)=>{
                        if (noteFindError) {
                            console.log(noteFindError);
                        } else {
                            console.log(foundNotes);
                            res.render("notes", {
                                username: req.body.username,
                                notes: foundNotes
                            });
                        }
                    });
                }
            });
        }
    });
});

// SERVER CONNECTION
app.listen(3000, () => {
    console.log("Server is running on port: http://localhost:3000/");
});