//controllers
app.controller('LoginCtrl', function($scope, $state, UserService){
	// Using a redirect.
	$scope.signInUser = function(){
		// Start a sign in process for an unauthenticated user.
		var provider = new firebase.auth.GoogleAuthProvider();
		provider.addScope('profile');
		provider.addScope('https://mail.google.com/')
		provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
		provider.addScope('https://www.googleapis.com/auth/gmail.modify');
		provider.addScope('https://www.googleapis.com/auth/calendar');
		provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
		firebase.auth().signInWithRedirect(provider);
	};

	var token = "";

	firebase.auth().getRedirectResult().then(function(result) {
		  if (result.credential) {
		    // This gives you a Google Access Token.
		    token = result.credential.accessToken;	   
		  }
		  var user = result.user;
	});

	firebase.auth().onAuthStateChanged(function(user) {		
	    if (user) {
	      // User is signed in.
	      $scope.currUser = firebase.auth().currentUser;
	      UserService.sendUser($scope.currUser);
	      $scope.currUserId = $scope.currUser.providerData[0].uid;
	      writeUserData($scope.currUser);
	      $scope.getMessages($scope.currUserId);
	    }
	});

	$scope.getMessages = function(curruserid){
		  var xhr = new XMLHttpRequest();
	      xhr.open('GET', 'https://www.googleapis.com/gmail/v1/users/'+curruserid+'/messages?q=from%3Acms-devnull%40csuglab.cornell.edu+new+assignment+&access_token='+token);
	      xhr.send();
	      xhr.onreadystatechange = function() { 
		        if (xhr.readyState == 4 && xhr.status == 200){
		            $scope.getMessageBody(xhr.responseText, curruserid);
		        }
		    }
	};

	$scope.getMessageBody = function(resp, userid){
		var messagesObj = JSON.parse(resp);
		var messageFull = {};
		var messageparsed = [];
		var f = (function(){
		    var xhr = [];
		    for (i = 0; i < messagesObj.resultSizeEstimate; i++){
		        (function (i){
		            xhr[i] = new XMLHttpRequest();
		            var mess = messagesObj.messages[i].id;
		            url = 'https://www.googleapis.com/gmail/v1/users/'+userid+'/messages/'+mess+'?access_token='+token;
		            xhr[i].open("GET", url, true);
		            xhr[i].onreadystatechange = function () {
		                if (xhr[i].readyState == 4 && xhr[i].status == 200) {
		                    messageFull = JSON.parse(xhr[i].responseText);
		                    messageparsed.push(messageFull);
		                   	$scope.getDeadlines(messageparsed, messagesObj.resultSizeEstimate);
		                }
		            };
		            xhr[i].send();
		        })(i);
		    }
		})();
	};
		
	$scope.getDeadlines = function(allMessages, lenMsgs){
		var subsArr = [];
		var bodyArr = [];
		$scope.allMessagesList = [];
		if(allMessages.length == lenMsgs){
			$scope.allMessagesList = allMessages;
			for(j=0; j<$scope.allMessagesList.length; j++){
				for(k=0; k<$scope.allMessagesList[j].payload.headers.length; k++){
					if ($scope.allMessagesList[j].payload.headers[k].name == "Subject"){
						subsArr.push($scope.allMessagesList[j].payload.headers[k].value);
					}
				}
				bodyArr.push($scope.allMessagesList[j].snippet);
			}	
			/*console.log(subsArr);*/
			UserService.sendSubjectLine(subsArr);		
			UserService.sendBody(bodyArr);
			UserService.sendToken(token);
		}
		$state.go('homepage');
	};

	if(UserService.getUser()!=undefined){
		$scope.currentUser = UserService.getUser();
		$scope.currentUserId = $scope.currentUser.providerData[0].uid;
	}	

	function writeUserData(currUser) {
	  firebase.database().ref('users/' + currUser.uid).set({
	    id: currUser.uid,
	    gmailid: currUser.providerData[0].uid,
	    username: currUser.providerData[0].displayName
	  });
	};
});

app.controller('HomepageCtrl', function($scope, $state, UserService, $ionicModal){

	$scope.eventModel = 1;

	$scope.eventsArray = [{}];
	$scope.eventsArray.pop();
	$scope.eventsCompleted = [{}];
	$scope.eventsCompleted.pop();
	$scope.assnmtid = "";

	/*$scope.event = {
		checked:{}
	};*/

	$scope.checkModel = function(valmodel){
		if(valmodel == true){
			return true;
		}
	};

	$scope.iter = 0;

	$scope.formatData = function(){
		$scope.subjectsArray = UserService.getSubjectLine();
		$scope.subjects = $scope.subjectsArray;
		$scope.assignmentArray = UserService.getBody();
		$scope.assignment = $scope.assignmentArray;		
		$scope.title = [];
		$scope.duedate = [];
		$scope.lastindexspace = 0;
		$scope.dateparsestring = [];
		$scope.dateNow = new Date();
		$scope.dateNow = String($scope.dateNow).split(/\s+/).slice(1,4).join(" ");		
		if($scope.subjects && $scope.iter==0){
			for(i=0; i<$scope.subjects.length; i++){
				$scope.assignment[i] = $scope.assignment[i].split('.')[0];
				$scope.title[i] = $scope.assignment[i].split("has been released and is due")[0];
				$scope.duedate[i] = $scope.assignment[i].split("has been released and is due")[1];
				$scope.lastindexspace = $scope.duedate[i].lastIndexOf(" ");				
				// commented code below for showing assignments having due date equal to today or later, commented to show all deadlines currently				
				/*$scope.dateparsestring[i] = $scope.duedate[i].substr(0, $scope.lastindexspace);
				if(Date.parse($scope.dateparsestring[i]) - Date.parse($scope.dateNow) >= 0){					
					$scope.eventsArray.push({"name":$scope.subjects[i].trim().split('-')[0], "assignment":$scope.assignment[i].trim(), "title":$scope.title[i].trim(), "due":$scope.duedate[i].trim()});
				}*/	
				$scope.eventsArray.push({"name":$scope.subjects[i].trim().split('-')[0], "assignment":$scope.assignment[i].trim(), "title":$scope.title[i].trim(), "due":$scope.duedate[i].trim()});			
			}
			$scope.iter=1;
		}
		
		if($scope.subjects && $scope.subjects.length==0){
			$scope.eventsArray = {"name":"You do not have any upcoming deadlines"};
		}
		return $scope.eventsArray;
	};

	$scope.events = function(){
		return $scope.formatData();
	};

	$scope.monthKey = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	$scope.markAsComplete = function(assignmentName, index, echecked){
		$scope.remInd = 0;
		if(echecked==true){
			$scope.eventsCompleted.push(assignmentName);
		}else{
			$scope.remInd = $scope.eventsCompleted.findIndex(x => x.assignment == assignmentName.assignment);
			$scope.eventsCompleted.splice($scope.remInd, 1);
		}
	};

	$ionicModal.fromTemplateUrl('calendar-modal.html', {
	    scope: $scope,
	    animation: 'slide-in-up'
	  }).then(function(modal) {
	    $scope.modal2 = modal;
	  });
	  $scope.openCalModal = function(){
	  	$scope.modal2.show();
	  };
	  $scope.closeCalModal = function() {
	    $scope.modal2.hide();
	  };

	$ionicModal.fromTemplateUrl('event-modal.html', {
	    scope: $scope,
	    animation: 'slide-in-up'
	  }).then(function(modal) {
	    $scope.modal1 = modal;
	  });
	  $scope.eventtodelete = {};
	  $scope.removeInd = 0;
	  $scope.openDeleteModal = function(eventDesc, modelVal, eventId) {
	  	$scope.assnmtid = eventId;
	  	$scope.eventtodelete = eventDesc;
	    $scope.modal1.show();
	  };
	  $scope.deleteEvent = function(){
	  	//$scope.removeInd = $scope.eventsArray.findIndex(x => x.assignment == $scope.eventtodelete.assignment);
		//$scope.eventsArray.splice($scope.removeInd, 1);
		$scope.removeInd = $scope.eventsCompleted.findIndex(x => x.assignment == $scope.eventtodelete.assignment);
		$scope.eventsCompleted.splice($scope.removeInd, 1);
		$scope.eventsArray.splice($scope.assnmtid, 1);
		/*var targetElem = document.getElementById("listItem"+$scope.assnmtid);
		if(!(angular.element(targetElem).children("div.event-details").hasClass("doneClass"))){
			angular.element(targetElem).children("div.doneClass").removeClass("doneClass");
			angular.element(targetElem).children("div.checkbox input").removeAttr("checked");
			$scope.eventModel = 0;
		}*/		
		$scope.modal1.hide();
	  };
	  $scope.closeModal = function() {
	    $scope.modal1.hide();
	    $scope.eventModel = 1;
	  };
	  // Cleanup the modal when we're done with it!
	  $scope.$on('$destroy', function() {
	    $scope.modal1.remove();
	    $scope.modal2.remove();
	  });
	  // Execute action on hide modal
	  $scope.$on('modal.hidden', function() {
	    // Execute action
	  });
	  // Execute action on remove modal
	  $scope.$on('modal.removed', function() {
	    // Execute action
	  });


	/*$scope.deleteEvent = function(asnmname){
		$scope.removeInd = $scope.eventsArray.findIndex(x => x.assignment == asnmname.assignment);
		$scope.eventsArray.splice($scope.removeInd, 1);
	};
*/

	var userNow = firebase.auth().currentUser.uid;
	$scope.subjectsArray = [];
	firebase.database().ref('/users/' + userNow).once('value').then(function(snapshot) {
	  var usergmailid = snapshot.val().gmailid;
	  var usernameid = snapshot.val().username;
	  $scope.tempname = usernameid;
	  $scope.username = $scope.tempname;
	});

	$scope.getuserprofilepic = function(){
		return UserService.getUser().photoURL;
	};

	$scope.addToCalendar = function(){
		  $scope.thetoken = UserService.getToken();
		  
		  var removeIndex = 0;
		  $scope.calendarEventsArray = angular.copy($scope.eventsArray);

		  for(j=0; j<$scope.eventsCompleted.length; j++){
		  	removeIndex = $scope.calendarEventsArray.findIndex(x => x.assignment == $scope.eventsCompleted[j].assignment);
		  	$scope.calendarEventsArray.splice(removeIndex, 1);
		  }	

		  var cdate = "";  
		  var cdateYear = "";
		  var cdateDay = "";
		  var cdateMonth = "";
		  var calDate = "";		  
		 
		  var g = (function(){
			for(k=0; k<$scope.calendarEventsArray.length; k++){
				$scope.calendarEntry = [{}];
		  		$scope.calendarEntry.pop();
    			(function(k){
    				// format event dates for calendar api input
					cdate = $scope.calendarEventsArray[k].due.replace(",", "").split(" ");
					cdateYear = cdate[2];

					if(parseInt(cdate[1]) < 10){
						cdateDay = "0"+cdate[1];
					} else{
						cdateDay = cdate[1];
					}

					cdateMonth = $scope.monthKey.indexOf(cdate[0])+1;

					calDate = cdateYear+"-"+cdateMonth+"-"+cdateDay;

		  			$scope.summaryname = $scope.calendarEventsArray[k].name+$scope.calendarEventsArray[k].title;
		  	  		$scope.calendarEntry.push({"summary":$scope.summaryname, "start":{"date":calDate}, "end":{"date":calDate}, "reminders":{"useDefault":true}});
					var xhttp = new XMLHttpRequest();
		  	  		xhttp.open("POST", "https://www.googleapis.com/calendar/v3/calendars/primary/events?access_token="+$scope.thetoken, true);
				  	xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");		  
				  	xhttp.onreadystatechange = function() {
				    	if (xhttp.readyState == 4 && xhttp.status == 200) {
				      		console.log(JSON.parse(xhttp.responseText));
				    	}
			  		};
			  		console.log($scope.calendarEntry[0]);
					xhttp.send(JSON.stringify($scope.calendarEntry[0]));  
		  			})(k);
		  		}
		  })();
	};

	$scope.logoutUser = function(){
		firebase.auth().signOut().then(function() {
		  console.log('Signed Out');
		  $state.go('login');
		}, function(error) {
		  console.error('Sign Out Error', error);
		});
	};

});