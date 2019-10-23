# HB+ with Minio file storage

You can configure HB+ to use Minio as a file server. Genral configuration is:

## Using with Minio
```
hasura-backend-plus:
   image: 'elitan/hasura-backend-plus'
   restart: always
   environment:
     PORT: 3000
     HASURA_GRAPHQL_ENDPOINT: http://graphql-engine:8080/v1alpha1/graphql
     HASURA_GRAPHQL_ADMIN_SECRET: <hasura-admin-secret>
     HASURA_GRAPHQL_JWT_SECRET: {"type":"HS256", "key": "secret_key"}
     USER_FIELDS: ''
     S3_ACCESS_KEY_ID: <access-key-here>
     S3_SECRET_ACCESS_KEY: <secret-key-here>
     S3_ENDPOINT: http://minio:9000
     S3_BUCKET: <projectname as bucket name>
     REFRESH_TOKEN_EXPIRES: 54000
   volumes:
     - './storage-rules:/app/src/storage/rules'
 minio:
   image: minio/minio
   restart: always
   volumes:
     - './minio_volume/data:/export'
     - './minio_volume/config:/root/.minio'
   ports:
   - 9000:9000
   environment:
     MINIO_ACCESS_KEY: <access-key-here> ## min 8 character
     MINIO_SECRET_KEY: <secret-key-here> ## min 8 character
     S3_BUCKET: <projectname as bucket name>
   entrypoint: sh
   command: '-c ''mkdir -p /export/$${S3_bucket} && /usr/bin/minio server /export'''
```
You can read more or ask question about integrate Minio with HB+ here: https://github.com/elitan/hasura-backend-plus/issues/9

## Using this example
Just download `docker-compose.yml` file and run `docker-compose up -d`. Enjoy HB+ :wink:
