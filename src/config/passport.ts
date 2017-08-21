// import * as passport from "passport";
// import * as passportOAuth2 from "passport-oauth2";
// import * as request from "request";

// import { User } from "../models/user";
// import { Request, Response, NextFunction } from "express";

// const OAuth2Strategy = passportOAuth2.Strategy;

// passport.serializeUser<any, any>((user, done) => {
//   done(undefined, user.id);
// });

// passport.deserializeUser((id, done) => {
//   User.findById(id, (err, user) => {
//     done(err, user);
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
//     User.findOne({ authId: accessToken.userId}, (err, existingUser) => {
//         if (err) return done(err);
//         if (existingUser) return done(undefined, existingUser);
//         const tempUser: any = createUser(accessToken.userId , accessToken.value, done);
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

// function createUser(userId: string, token: string, done: any) {
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
//             const tempUser = JSON.parse(body);
//             const user = new User({
//                 authId: userId,
//                 userId: tempUser.id,
//                 firstName: tempUser.firstName,
//                 lastName: tempUser.lastName,
//                 phone: tempUser.phone
//             });
//             user.save((err: Error) => {
//                 return done(err, user);
//             });
//         }
//     );
// }