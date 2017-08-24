# Kartoffel - 0.1.2

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
| Method 	| Endpoint          	            | Description                    	| Required Permissions  	| Example           	|
|--------	|--------------------------------   |--------------------------------	|-----------------------	|-------------------	|
| GET    	| /api/user/getAll     	            | Returns all the users            	| None                  	| /api/user/getAll     	|
| POST    	| /api/user          	            | Create new user                	| None (yet)              	| /api/user          	|
| GET           | /api/user/:id                     | Get user by his ID                | None                          | /api/user/1234567     |
| DELETE        | /api/user/:id                     | Remove a user by his ID           | None (yet)                    | /api/user/1234567     |