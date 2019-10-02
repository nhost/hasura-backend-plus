const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL,
} = require('../config');

let router = express.Router();

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: GITHUB_CALLBACK_URL,
  scope: ['user:email'],
},
function(accessToken, refreshToken, profile, cb) {
  console.log('---Strategy---');
  console.log({accessToken});
  console.log({refreshToken});
  console.log({profile});

  // find or create user

  console.log(profile.id);

  const err = null;

  return cb(err, profile);
}));

router.get('/',
  passport.authenticate('github', {
    session: false,
  })
);

router.get('/callback',
  passport.authenticate('github', {
    failureRedirect: '/login',
    session: false,
   }),
  function(req, res) {
    // Successful authentication, redirect home.
    console.log('---/callback---');
    console.log(req.user);
    console.log('successful authenticate, send OK');
    // res.send('OK');
    res.redirect('http://localhost:3000');
  }
);

module.exports = router;
