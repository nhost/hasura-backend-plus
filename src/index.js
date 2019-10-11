const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('passport');

const {
  AUTH_ACTIVE,
  AUTH_LOCAL_ACTIVE,
  AUTH_GITHUB_ACTIVE,
  AUTH_GOOGLE_ACTIVE,
  AUTH_FACEBOOK_ACTIVE,
  STORAGE_ACTIVE,
} = require('./config');

const app = express();

// middleware
app.use(express.json());
app.use(cors({
	credentials: true,
	origin: true,
}));
app.use(morgan('tiny'));
app.use(cookieParser());
app.disable('x-powered-by');

// routes
app.use(passport.initialize());

if (AUTH_ACTIVE) {
  console.log('auth active');
  const auth = require('./auth/auth');
  app.use('/auth', auth);

  if (AUTH_LOCAL_ACTIVE) {
    console.log('auth local active');
    const auth_local = require('./auth/local');
    app.use('/auth/local', auth_local);
  }

  if (AUTH_GITHUB_ACTIVE) {
    console.log('auth github active');
    const auth_github = require('./auth/github');
    app.use('/auth/github', auth_github);
  }
  if (AUTH_GOOGLE_ACTIVE) {
    console.log('auth google active');
    const auth_google = require('./auth/google');
    app.use('/auth/google', auth_google);
  }
  if (AUTH_FACEBOOK_ACTIVE) {
    console.log('auth facebook active');
    const auth_facebook = require('./auth/facebook');
    app.use('/auth/facebook', auth_facebook);
  }
}

if (STORAGE_ACTIVE) {
  console.log('storage active');
  const storage = require('./storage/storage');
  app.use('/storage', storage);
}

// error handler
app.use((err, req, res, next) => {
	if (err) {
		console.error(err.message);
		console.error(err.stack);
		return res.status(err.output.statusCode || 500).json(err.output.payload);
	}
});

const port = process.env.PORT || 3010;
app.listen(port, () => {
	console.log(`listening on port ${port}`);
});
