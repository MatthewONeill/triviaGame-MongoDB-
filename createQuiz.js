//Client Side Javascript for create quiz

let qArray = []; //used for removing html from createQuiz
let qArray2 = []; //sending to quizzes

function saveQuiz(){
	let creatorName = document.getElementById("creator").value; //gets creator name from index
	let tags = document.getElementById("tags").value; //gets tags from index
	let tagsArray = tags.split(" ") //splits the tags spaces
	
	if(creatorName == ""){ //if they didnt enter anything
		alert("Enter a name"); //alert
	}
	else if(tags == ""){ //if no tags entered
		alert("Enter a tag"); // alert
	}
	else if(qArray.length == 0){ //if no questions were added
		alert("Add a question"); //alert
	}
	
	let sendingJSON = {}; //creating a object to send JSON
	
	sendingJSON.creatorName = creatorName; //setting creator name
	sendingJSON.tags = tagsArray; //setting tags
	sendingJSON.questions = qArray2; //setting questions
	
	let xhttp = new XMLHttpRequest(); //xmlhttprequest to quizzes
	xhttp.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			let id = JSON.parse(this.response) //gets id back from postQuizzes()
			window.open("http://localhost:3000/quiz/"+id.result);	//redirects client to /quiz page
		}
	};
	xhttp.open("POST","http://localhost:3000/quizzes",true); 
	xhttp.setRequestHeader("Content-Type","application/json"); //sends json
	xhttp.send(JSON.stringify({quiz: sendingJSON})); //stringify
}

function questions(){
	let difficulty = document.getElementById("difficulty").value; //gets difficulty value from index pug
	let category = document.getElementById("category").value; //gets category value from index pug
	
	let xhttp = new XMLHttpRequest(); //xmlhttprequest to /questions
	
	xhttp.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			let html = ""; //creates blank html string to add html to
			let questions = JSON.parse(this.responseText).questions; //gets questions back from questions()
			let counter = 0; //counter for id
			questions.forEach(question =>{ //iterates through qestions
				html += '<button id="add'+counter+'" type="button" onclick="Add('+counter+')">Add</button><a id="'+counter+'" href= http://localhost:3000/questions/' + question._id + '>' + question.question + '</a><br>';
				counter++; //add html and increase counter
			});
			
			document.getElementById("questions").innerHTML = html; //change the questions element to the updated html
		}
	};
	
	let url = "http://localhost:3000/questions"; //set the base url
	
	if(difficulty != "All"){ //if all option is not selected
		if(url.includes("?")){ //if its not the first query
			url += "&difficulty=" + difficulty; //add difficulty query with &
		}
		else{ //else its the first query
			url += "?difficulty=" + difficulty; //add difficulty query with ? 
		}
	}
	if(category != "All"){
		if(url.includes("?")){
			url += "&category=" + encodeURIComponent(category);
		}
		else{
			url += "?category=" + encodeURIComponent(category);
		}
	}
	
	xhttp.open("GET",url, true);
	xhttp.setRequestHeader('Accept','application/json'); //specifies json
	xhttp.send();
	
}

function Add(id){
	let button = document.getElementById("add"+id); //gets button from index with the id
	let link = document.getElementById(id); //gets link id
	
	//creates the remove html to display
	let html = '<button id="remove'+id+'" type="button" onclick="Remove('+id+')">Remove</button><a id="'+id+'" target="_blank" href=' + link + '>' + link.text +'</a><br>';
	let arrayHTML = '<a id="'+id+'" target="_blank" href=' + link + '>' + link.text +'</a>';
	//array html to send
	
	let add = 0; //if add becomes 1 you add the question to qarray
	
	if(qArray.length == 0){ //add the first item regardless
		qArray.push(html);
		qArray2.push(arrayHTML);
	}
	else{ //if its not the first item
		for(let i = 0; i < qArray.length; i++){
			if(qArray[i] == html){ //go through the qArray and check if there is html equal to anything in the array
				add = 0;
				alert("You already added that question");
			}
			else{
				add = 1; //if its not in the qArray then add it 
			}
		}
		if(add == 1){//adds 
			qArray.push(html);
			qArray2.push(arrayHTML);
		}
	}
	
	let innerHTML = ""; //recreates the new html
	
	for(let i = 0; i < qArray.length; i++){
		innerHTML += qArray[i]
	}
	
	document.getElementById("addedQuestions").innerHTML = innerHTML; //displays to added questions 
}

function Remove(id){
	let button = document.getElementById("remove"+id);
	let link = document.getElementById(id);
	//recreates the html
	let html = '<button id="remove'+id+'" type="button" onclick="Remove('+id+')">Remove</button><a id="'+id+'" target="_blank" href=' + link + '>' + link.text + '</a><br>';
	let arrayHTML = '<a id="'+id+'" target="_blank" href=' + link + '>' + link.text +'</a>';
	
	//removes the elements
	button.remove();
	link.remove();
	
	for(let i = 0; i < qArray.length; i++){
		if(qArray[i] == html){ //if there is html in the array that matches then remove it
			qArray.splice(i,1);
			qArray2.splice(i,1);
		}		
	}
}