# Kartoffel - 0.1.3

## CI Information
### Build Status
[![Build Status](https://travis-ci.org/AllKinds/Kartoffel.svg?branch=master)](https://travis-ci.org/AllKinds/Kartoffel)

## Getting Started
### Installation
        npm install

### Testing
        npm test

### Running the server
        npm start

## API Endpoints
### 1. User
| Method 	| Endpoint          	            | Description                    	        | Required Permissions  	| Example           	|
|--------	|--------------------------------   |----------------------------------------   |-----------------------	|-------------------	|
| GET    	| /api/user/getAll     	            | Returns all the users            	        | None                  	| /api/user/getAll     	|
| POST    	| /api/user          	            | Create new user                	        | None (yet)              	| /api/user          	|
| GET           | /api/user/:id                     | Get user by his ID                        | None                          | /api/user/1234567     |
| DELETE        | /api/user/:id                     | Remove a user by his ID                   | None (yet)                    | /api/user/1234567     |
| PUT           | /api/user/:id/personal            | Update user's personal info by his ID     | None (yet)                    | /api/user/1234567     |

### 2. Strong Groups
| Method 	| Endpoint          	            | Description                    	        | Required Permissions  	| Example           	        |
|--------	|--------------------------------   |----------------------------------------   |-----------------------	|----------------------------   |
| GET    	| /api/kartoffel/getAll             | Returns all the kartoffeln      	        | None                  	| /api/kartoffel/getAll     	|
| GET    	| /api/kartoffel/:id                | Returns kartoffel by ID      	        | None                  	| /api/kartoffel/1234567     	|
| POST    	| /api/kartoffel/addMembers         | Add new members to kartoffel    	        | None (yet)              	| /api/kartoffel/addMembers 	|
| PUT    	| /api/kartoffel/removeMembers      | Remove members from a kartoffel           | None (yet)              	| /api/kartoffel/removeMembers  |
| PUT    	| /api/kartoffel/transferMembers    | Move admins between kartoffeln            | None (yet)              	| /api/kartoffel/transferMembers|
| PUT    	| /api/kartoffel/addAdmins          | Add new admins to kartoffel    	        | None (yet)              	| /api/kartoffel/addAdmins   	|
| PUT    	| /api/kartoffel/removeAdmins       | Remove admins from a kartoffel            | None (yet)              	| /api/kartoffel/removeAdmins   |
| PUT    	| /api/kartoffel/transferAdmins     | Move members between kartoffeln           | None (yet)              	| /api/kartoffel/transferAdmins |
| PUT    	| /api/kartoffel/adoption           | Move Kartoffeln to another Kartoffel      | None (yet)              	| /api/kartoffel/adoption     	|