const express = require('express');
const Boom = require('boom');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const auth = require('./auth');
const storage = require('./storage');
// const functions = require('./functions');

const app = express();

const {
	ALLOWED_ORIGIN,
} = require('./config');

// middleware
app.use(express.json());
app.use(cors({
	credentials: true,
	origin: function(origin, cb){
		// allow requests with no origin
		// (like mobile apps or curl requests)
		if(!origin) return cb(null, true);
		if(ALLOWED_ORIGIN !== origin){
			return cb(Boom.badRequest('CORS not OK'));
		}
		return cb(null, true);
	},
}));
app.use(morgan('tiny'));
app.use(cookieParser());
app.disable('x-powered-by');

// routes
app.use('/auth', auth);
app.use('/storage', storage);
// app.use('/functions', functions);

// error handler
app.use((err, req, res, next) => {
	if (err) {
		console.error(err.message);
		console.error(err.stack);
		return res.status(err.output.statusCode || 500).json(err.output.payload);
	}
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`listening on port ${port}`);
});
