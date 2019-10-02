const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('passport');

const auth = require('./auth/auth');
const auth_local = require('./auth/local');
const auth_github = require('./auth/github');
const storage = require('./storage/storage');

const {
  AUTH_ACTIVE,
  AUTH_LOCAL_ACTIVE,
  AUTH_GITHUB_ACTIVE,
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
  app.use('/auth', auth);

  if (AUTH_LOCAL_ACTIVE) {
    console.log('auth local active');
    app.use('/auth/local', auth_local);
  }

  if (AUTH_GITHUB_ACTIVE) {
    console.log('auth github active');
    app.use('/auth/github', auth_github);
  }
}

if (STORAGE_ACTIVE) {
  console.log('storage active');
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
