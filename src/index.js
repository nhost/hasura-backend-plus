const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const auth = require('./auth/auth');
const storage = require('./storage/storage');
const graphql = require('./graphql/graphql');

const {
  AUTH_ACTIVE,
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
graphql.applyMiddleware({ app });

// routes
if (AUTH_ACTIVE) {
  app.use('/auth', auth);
}
if (STORAGE_ACTIVE) {
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
	console.log( `listening on port ${ port }` );
	console.log(`🚀 Server ready at http://localhost:${ port }/${graphql.graphqlPath}`);
});
