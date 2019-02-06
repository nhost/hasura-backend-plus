const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const auth = require('./auth/auth');
const storage = require('./storage/storage');

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
app.use('/auth', auth);
app.use('/storage', storage);

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
