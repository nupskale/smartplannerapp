app.factory('UserService', function(){
	var userdata = {};
	userdata.sendUser = function(userdetails){
		this.userdetails = userdetails;
	};	
	userdata.getUser = function(){
		return this.userdetails;
	};
	userdata.sendSubjectLine = function(subjects){
		this.subjects = subjects;
	};
	userdata.getSubjectLine = function(){
		return this.subjects;
	};
	userdata.sendBody = function(mailbody){
		this.mailbody = mailbody;
	};
	userdata.getBody = function(){
		return this.mailbody;
	};
	userdata.sendToken = function(token){
		this.token = token;
	}
	userdata.getToken = function(){
		return this.token;
	}
	return userdata;
});