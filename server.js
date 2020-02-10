//Express server for Assignment 4

//Create express app
const express = require('express');
const fs = require('fs');
let app = express();

//Database variables
let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let db;
let ObjectId = require('mongodb').ObjectID //needed to create object id

//View engine
app.set("view engine", "pug");

//Set up the routes
app.use(express.static("public"));
app.use(express.json());
app.get("/questions", questions);
app.get("/questions/:qID", questionsQID);
app.get("/createQuiz.js", createQuizPipe);
app.get("/createQuiz", createQuiz);
app.get("/quizzes", getQuizzes);
app.get("/quiz/:quizID", getQuizId);
app.post("/quizzes", postQuizzes);


function questions(req, res, next){
	let queryObj = {}; //creates a queryObj that will be used to find in the database
	let difficulty = req.query.difficulty; //creates a variable that will be null if req.query.difficulty is not entered or if it isn't null it will be the param
	let category = req.query.category; // same as difficulty variable but with req.query.category
	
	if(difficulty != null){ //adds difficulty to the query obj if its not null
		queryObj.difficulty = difficulty;
	}
	if(category != null){ //adds category to the query obj if its not null
		queryObj.category = category;
	}
	
	db.collection('questions').find(queryObj).limit(25).toArray(function(err, results){ //queries for whatever was entered in query obj, limits to 25 then makes it to an array
		if (err) throw err; 
		
		res.format({
			'text/html': function(){
				res.render("questions",{questions: results}); //sends the questions array in json to questions pug
			},
			'application/json': function(){
				res.send(JSON.stringify({questions: results}));	//makes it json string to send if json is requested
			}
		});
	});
}

function questionsQID(req, res, next){
	if(req.params.qID.length != 24){ //all qIDs are 24 chars long
		res.status(404).send("Not a valid ID"); //so if its not 24 chars long its not a valid id
	}	
	let queryObj = new ObjectId(req.params.qID); //create the query obj
	
	db.collection('questions').find(queryObj).toArray(function(err, result){
		if (err) throw err;
		if(result.length == 0){ //if theres no results its not a valid id
			res.status(404).send("Not a valid ID");
		}
		else{
			res.format({
				'application/json': function(){ //send json
					res.status(200).send(JSON.stringify({question:result}));
				},
				'text/html': function(){ //send html with a json
					res.render("singleQuestion", {question: result});
				}
				
			});
		}
			
	});
	
}

function createQuizPipe(req, res, next){
	res.writeHead(200, {'Content-Type': 'application/javascript'}); //pipes the javascript 
	fs.createReadStream('createQuiz.js').pipe(res);
}

function createQuiz(req, res, next){
	db.collection('questions').distinct('difficulty', function(err, results){ //searches database for questions with distinct difficulties
		if(err) throw err;
		db.collection('questions').distinct('category', function(err, results2){ //searches database for questions with distinct categories
			if(err) throw err;
			res.render("index", {difficulty: results, category: results2}); //results is all distinct difficulties and results2 is all distinct categories
		});
	});

}

function getQuizzes(req, res, next){
	let queryObj = {}; //creates a query obj to be used in find
	let creatorName = req.query.creator; //takes query.creator to a variable
	let tags = req.query.tag; //takes query.tag to a variable
	
	if(creatorName != null){ //checks if there is a query for creator
		queryObj.creatorName = {$regex: creatorName, $options: 'i'}; //if there is then update the queryObj with regex so it does partial +case insensitivity
	}
	if(tags != null){
		queryObj.tags = {$regex: '^' + tags + '$', $options: 'i'}; //^ and $ to escape the partial 
	}
	db.collection('quizzes').find(queryObj).toArray(function(err, results){ //searches through quizzes collection to find the query and sends to an array
		if (err) throw err;
		
		res.format({
			'application/json': function(){
				res.status(200).send(JSON.stringify({quizzes: results})); //stringifys it to send JSON
			},
			'text/html': function(){
				res.render("quizzes",({quizzes:results})); //sends the results array with quizzes key
			}
		});
	});
	
}

function getQuizId(req, res, next){
	if(req.params.quizID.length != 24){ //all qIDs are 24 chars long
		res.status(404).send("Not a valid ID"); //so if its not 24 chars long its not a valid id
	}	
	let queryObj = new ObjectId(req.params.quizID);
	db.collection('quizzes').find(queryObj).toArray(function(err,result){
		if (err) throw err;
		if(result.length == 0){ //if theres no results its not a valid id
			res.status(404).send("Not a valid ID");
		}
		else{
			res.format({
				'application/json':function(){
					res.status(200).send(JSON.stringify({quiz: result}));
				},
				'text/html':function(){
					res.render("singleQuiz",({quiz: result}));
				}
			});
		}
	});
	
	
}

function postQuizzes(req, res, next){
	let idArray = []; //gets all the id's
	let validArray = []; //gets all the valid questions

	for(let i = 0; i < req.body.quiz.questions.length; i++){ //this for loop breaks down the questions and extracts the id from the html
		let a = req.body.quiz.questions[i].split("/");
		let b = a[4].split(">");
		idArray.push(b[0]);
	}
	
	
	if(req.body.quiz.creatorName != ""){ //checks if valid creatorName
		if(req.body.quiz.tags != []){ //checks if theres tags
			for(let i = 0; i < idArray.length; i++){ 
				let queryObj = new ObjectId(idArray[i]);
				validArray.push(queryObj);
			}
			db.collection('questions').find({_id: {$in : validArray}}).toArray(function(err, results){ //finds all the questions with id
				if (err) throw err;
				
				let responseObj = {} //creates the proper obj to send in insertOne
				responseObj.creatorName = req.body.quiz.creatorName;
				responseObj.tags = req.body.quiz.tags;
				responseObj.questions = results;
				
				if(results.length == 0){
					res.status(404).send("Question not found");
				}
				else{
					db.collection('quizzes').insertOne(responseObj,function(err, result){ //inserts the quiz into the database
						res.status(200).send(JSON.stringify({result: result.insertedId}));
					});
				}
			});
		}
	}
	
}


// Initialize database connection
MongoClient.connect("mongodb://localhost:27017/", function(err, client) {
  if(err) throw err;

  //Get the a4 database
  db = client.db('a4');
  
  // Start server once Mongo is initialized
  app.listen(3000);
  console.log("Listening on port 3000");
});