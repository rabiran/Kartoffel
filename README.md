# Kartoffel - 0.2.2

## CI Information
### Build Status
[![Build Status](https://travis-ci.org/rabiran/Kartoffel.svg?branch=master)](https://travis-ci.org/rabiran/Kartoffel)
[![Coverage Status](https://coveralls.io/repos/github/rabiran/Kartoffel/badge.svg?branch=master)](https://coveralls.io/github/rabiran/Kartoffel?branch=master)
[![Build Status](http://jenkins-ci.centralus.cloudapp.azure.com/buildStatus/icon?job=NewLand/Kartoffel/master)](http://jenkins-ci.centralus.cloudapp.azure.com/job/NewLand/job/Kartoffel/job/master/)

## Getting Started
### Installation
        npm install

### Testing
        npm test

### Running the server with compilation
        npm start

### Running the server without compilation
        npm run serve

## API Endpoints
### 1. User
| Method 	| Endpoint          	        | Description                                   | Required Permissions  | Example           	        |
|--------	|-----------------------------  |--------------------------------------------   |---------------------  |-----------------------------  |
| GET    	| /api/user/getAll     	        | Returns all the users            	        | Basic                 | /api/user/getAll     	        |
| GET           | /api/user/:id                 | Get user by ID                                | Basic                 | /api/user/1234567             |
| GET    	| /api/user/getUpdated/:from               | Returns users updated from a given date       | Basic                 | /api/user/getUpdated/1500000000000	|
| GET           | /api/user/in/:group           | Get all the users in group                    | Basic                 | /api/user/in/111111           |
| POST    	| /api/user                     | Create new user                	        | Advanced              | /api/user          	        |
| DELETE        | /api/user/:id                 | Remove a user by ID                           | Advanced              | /api/user/1234567             |
| PUT           | /api/user/                    | Update user's info                            | Advanced              | /api/user                     |
| PUT           | /api/user/:id/personal        | Update user's personal info by his ID         | User                  | /api/user/1234567/personal    |
| PUT           | /api/user/:id/assign              | Assign user to a Kartoffel                    | Advanced              | /api/user/1234567/assign              |
| PUT           | /api/user/:id/dismiss             | Dismiss a user from his current Kartoffel     | Advanced              | /api/user/1234567/dismiss             |
| PUT           | /api/user/:id/manage              | Appoint a user to manage a Kartoffel          | Advanced              | /api/user/1234567/manage              |
| PUT           | /api/user/:id/resign              | Discharge user from management                | Advanced              | /api/user/1234567/resign              |

### 2. Strong Groups
| Method        | Endpoint          	        | Description                                   | Required Permissions  | Example           	        |
|--------	|-------------------------------|---------------------------------------------  |----------------------	|----------------------------   |
| GET    	| /api/kartoffel         | Returns all the kartoffeln. You can add querystring for search      	        | Basic                 | /api/kartoffel    	|
| GET    	| /api/kartoffel/:id            | Returns kartoffel by ID. By default comes unpopulated. To populate use querystring: populate=fields_to_populate     	                | Basic                 | /api/kartoffel/1234567?populate=children     	|
| GET     | /api/kartoffel/:id/members    | Return all the members under the givven kartoffel    | Basic                 | /api/kartoffel/1234567/members
| POST    	| /api/kartoffel                | Create a Kartoffel                            | Advanced              | /api/kartoffel/adoption     	|
| PUT    	| /api/kartoffel/adoption       | Move Kartoffeln to another Kartoffel          | Advanced              | /api/kartoffel/adoption     	|
| DELETE        | /api/kartoffel/:id            | Remove a user by ID                           | Advanced              | /api/kartoffel/1234567        |
