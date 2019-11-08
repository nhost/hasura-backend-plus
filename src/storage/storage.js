const express = require('express');
const Joi = require('joi');
const Boom = require('boom');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const mime = require('mime-types');
const uuidv4 = require('uuid/v4');

const {
  HASURA_GRAPHQL_JWT_SECRET,
  HASURA_GRAPHQL_ADMIN_SECRET,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_ENDPOINT,
  S3_BUCKET,
} = require('../config');

const { storagePermission } = require('./rules');

const router = express.Router();

const s3  = new AWS.S3({
  accessKeyId: S3_ACCESS_KEY_ID,
  secretAccessKey: S3_SECRET_ACCESS_KEY,
  endpoint: S3_ENDPOINT,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

const admin_secret_is_ok = (req) => {
  const { headers } = req;
  return 'x-hasura-admin-secret' in headers && headers['x-hasura-admin-secret'] == HASURA_GRAPHQL_ADMIN_SECRET;
};

const get_claims_from_request = (req) => {

  // check possible get param token

  const { authorization = '' } = req.headers;

  if (authorization === '') {
    return null;
  }

  const token = authorization !== '' ? authorization.replace('Bearer ', '') : jwt_token;

  try {
    const decoded = jwt.verify(
      token,
      HASURA_GRAPHQL_JWT_SECRET.key,
      {
        algorithms: HASURA_GRAPHQL_JWT_SECRET.type,
      }
    );
    return decoded['https://hasura.io/jwt/claims'];
  } catch (e) {
    console.error(e);
    return void 0;
  }
};

router.get('/fn/get-download-url/*', (req, res, next) => {
  const key = `${req.params[0]}`;

  // if not admin, do JWT checks
  if (!admin_secret_is_ok(req)) {

    const claims = get_claims_from_request(req);

    if (claims === undefined) {
      return next(Boom.unauthorized('Incorrect JWT Token'));
    }

    // check access of key for jwt token claims
    if (!storagePermission(key, 'read', claims)) {
      return next(Boom.unauthorized('You are not allowed to read this file'));
    }
  }

  const params = {
    Bucket: S3_BUCKET,
    Key: key,
  };

  s3.headObject(params, function (err, data) {

    if (err) {
      console.error(err);
      return next(Boom.forbidden());
    }

    const { token } = data.Metadata;

    res.send({
      token,
    });
  });
});

router.delete('/file/*', (req, res, next) => {

  const key = `${req.params[0]}`;

  // if not admin, do JWT checks
  if (!admin_secret_is_ok(req)) {

    const claims = get_claims_from_request(req);

    if (claims === undefined) {
      return next(Boom.unauthorized('Incorrect JWT Token'));
    }

    // check access of key for jwt token claims
    if (!storagePermission(key, 'write', claims)) {
      return next(Boom.unauthorized('You are not allowed to remove this file'));
    }
  }

  const params = {
    Bucket: S3_BUCKET,
    Key: key,
  };

  s3.deleteObject(params, (err, data) => {
    if (err) {
      console.log(err, err.stack);  // error
      return next(Boom.badImplementation('could not delete file'));
    }

    res.send('OK');
  });
});

router.get('/file/*', (req, res, next) => {
  const key = `${req.params[0]}`;

  const token = req.query.token;

  const params = {
    Bucket: S3_BUCKET,
    Key: key,
  };

  s3.headObject(params, function (err, data) {

    if (err) {
      console.error(err);
      return next(Boom.forbidden());
    }

    if (data.Metadata.token !== token) {
      return next(Boom.forbidden());
    }

    const stream = s3.getObject(params).createReadStream();

    // forward errors
    stream.on('error', function error(err) {
      console.error(err);
      return next(Boom.badImplementation());
    });

    //Add the content type to the response (it's not propagated from the S3 SDK)
    res.set('Content-Type', data.ContentType);
    res.set('Content-Length', data.ContentLength);
    res.set('Last-Modified', data.LastModified);
    res.set('Content-Disposition', `inline; filename="${data.Metadata.originalname}"`);
    res.set('Cache-Control', 'public, max-age=31557600');
    res.set('ETag', data.ETag);

    //Pipe the s3 object to the response
    stream.pipe(res);
  });
});


const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: S3_BUCKET,
    metadata: (req, file, cb) => {

      // TODO: Metadata
      // req.headres (metadata)

      cb(null, {
        originalname: file.originalname,
        token: req.token,
        // ...metadata,
      });
    },
    contentType: function (req, file, cb) {
      cb(null, file.mimetype);
    },
    key: function (req, file, cb) {

      // generate unique file names to be saved on the server
      const extension = mime.extension(file.mimetype);

      req.saved_file = {
        originalname  : file.originalname,
        mimetype: file.mimetype,
        encoding: file.encoding,
        key: `${req.file_path}`,
        extension,
        token: req.token,
      };

      cb(null, req.file_path);
    },
  }),
});

const upload_auth = (req, res, next) => {

  // path to where the file will be uploaded to
  try {
    req.file_path = req.headers['x-path']
    .replace(/^\/+/g, '') // remove /
    .replace(/^ +/g, ' '); // replace multiple (and single) spaces to single space.
  } catch (e) {
    return next(Boom.badImplementation('x-path header incorrect'));
  }

  // if not admin, do JWT checks
  if (!admin_secret_is_ok(req)) {

    const claims = get_claims_from_request(req);

    if (claims === undefined) {
      return next(Boom.unauthorized('Incorrect JWT Token'));
    }

    if (!storagePermission(req.file_path, 'write', claims)) {
      return next(Boom.unauthorized('You are not allowed to write files here'));
    }
  }

  // access token for file
  // will be saved as metadata
  req.token = uuidv4();

  // validation OK. Upload files
  next();
};

router.post('/upload', upload_auth, upload.array('file', 1), function (req, res) {
  res.json(req.saved_file);
});

module.exports = router;
