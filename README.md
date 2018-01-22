# Kartoffel - 0.1.4

## CI Information
### Build Status
[![Build Status](https://travis-ci.org/AllKinds/Kartoffel.svg?branch=master)](https://travis-ci.org/AllKinds/Kartoffel)

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
| PUT           | /api/user/assign              | Assign user to a Kartoffel                    | Advanced              | /api/user/assign              |
| PUT           | /api/user/dismiss             | Dismiss a user from his current Kartoffel     | Advanced              | /api/user/dismiss             |
| PUT           | /api/user/manage              | Appoint a user to manage a Kartoffel          | Advanced              | /api/user/manage              |
| PUT           | /api/user/resign              | Discharge user from management                | Advanced              | /api/user/resign              |

### 2. Strong Groups
| Method        | Endpoint          	        | Description                                   | Required Permissions  | Example           	        |
|--------	|-------------------------------|---------------------------------------------  |----------------------	|----------------------------   |
| GET    	| /api/kartoffel/getAll         | Returns all the kartoffeln      	        | Basic                 | /api/kartoffel/getAll     	|
| GET    	| /api/kartoffel/getUpdated/:fromDate      | Returns kartoffeln updated from a given date  | Basic                 | /api/kartoffel/getUpdated/1500000000000	|
| GET    	| /api/kartoffel/:id            | Returns kartoffel by ID      	                | Basic                 | /api/kartoffel/1234567     	|
| POST    	| /api/kartoffel                | Create a Kartoffel                            | Advanced              | /api/kartoffel/adoption     	|
| PUT    	| /api/kartoffel/adoption       | Move Kartoffeln to another Kartoffel          | Advanced              | /api/kartoffel/adoption     	|
| DELETE        | /api/kartoffel/:id            | Remove a user by ID                           | Advanced              | /api/kartoffel/1234567        |