#Smart Planner Application for automatic academic deadline scheduling

Smart planner is an Android based web application which brings deadlines from user's gmail account into the application and creates calendar events for incomplete assignments on Google Calendar.

This project is developed using the following:

* Ionic framework
* AngularJS
* Firebase for Google authentication
* Gmail Search API for fetching deadlines
* Google Calendar API for creating calendar events from the app

How to run the code
==================================

Install node.js from [nodejs.org](https://nodejs.org/en/)
Download smartplannerapp code from Github
Open node.js command prompt and navigate to the code directory
Install npm using
```
$ npm install
```
Install ionic using
```
$ npm install -g cordova ionic
```
Run the following command
```
$ ionic serve
```
How to set up a firebase account for google sign in
==================================

* Create a firebase account at <https://firebase.google.com>
* Click on 'Go to console'.
* Click on 'Create New Project' or 'Import Google project' if you have an existing project as a google developer.
* On the Overview page, select the option for 'Add Firebase to your web app'.
* This gives the code snippet which can be pasted in your application.
* In the application controller logic, implement google login using firebase by
```javascript
var provider = new firebase.auth.GoogleAuthProvider();
```
* Authenticate user by
```javascript
firebase.auth().signInWithRedirect(provider);
```
* The result function gives an access token which can be used for gmail and calendar APIs.
