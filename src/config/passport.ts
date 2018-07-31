// import * as passport from "passport";
// import * as passportOAuth2 from "passport-oauth2";
// import * as request from "request";

// import { Person } from "../models/person";
// import { Request, Response, NextFunction } from "express";

// const OAuth2Strategy = passportOAuth2.Strategy;

// passport.serializePerson<any, any>((person, done) => {
//   done(undefined, person.id);
// });

// passport.deserializePerson((id, done) => {
//   Person.findById(id, (err, person) => {
//     done(err, person);
//   });
// });

// /**
//  * OAuth Strategy
//  */

//  passport.use(new OAuth2Strategy({
//     authorizationURL: "http://localhost:3000/api/oauth2/authorize",
//     tokenURL: "http://localhost:3000/api/oauth2/token",
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:4000/auth/callback"
//  }, (accessToken: any, refreshToken, profile, done) => {
//     Person.findOne({ authId: accessToken.personId}, (err, existingPerson) => {
//         if (err) return done(err);
//         if (existingPerson) return done(undefined, existingPerson);
//         const tempPerson: any = createPerson(accessToken.personId , accessToken.value, done);
//     });
//  }));

//  /**
//   * Login Required middleware.
//   */
// export let isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.redirect("/auth");
// };

// function createPerson(personId: string, token: string, done: any) {
//     request(
//         {
//             url: "http://localhost:3000/api/dudu",
//             method: "GET",
//             headers : {
//                 "Authorization" : "Bearer " + token
//             }
//         }, (err, res, body) => {
//             // console.log(res);
//             console.log("res is: " + body);
//             const tempPerson = JSON.parse(body);
//             const person = new Person({
//                 authId: personId,
//                 personId: tempPerson.id,
//                 firstName: tempPerson.firstName,
//                 lastName: tempPerson.lastName,
//                 phone: tempPerson.phone
//             });
//             person.save((err: Error) => {
//                 return done(err, person);
//             });
//         }
//     );
// }
