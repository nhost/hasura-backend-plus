# Upgrade Hasura Backend Plus v1 to v2

> Take one (or more ) backups of your current database!

### 1. Apply migrations

```
# Clone Hasura Backend Plus locally
git clone git@github.com:nhost/hasura-backend-plus.git

# Create `tmp` directory
mkdir tmp

# copy `migraitons-v1` to tmp migrations folder
cp -r hasura-backend-plus/migrations-v1 tmp/migrations

# change dir to `tmp`
cd tmp

# Create a Hasura config file specify version 2
echo "version: 2" > config.yaml

# Apply migrations
hasura migrate apply --endpoint=https://hasura-endpoint.com --admin-secret=<admin-secret>
```

### 2. Track new tables and relationships

Go to the Hasura console and track all tables/relationships, specifically in the `auth` schema.

### 3. Done

🥳

---

# FAQ

## What does this migration script do?

1. Drop all Hasura relationships specific for HBPv1.
2. Crete new tables specific for HBPv2 and copy relevant data from old to the new tables.

## Will this script always work?

Almost. The script will work in most cases, even if you have made custom columns and relationships on the user's table.

The script will probably not work if you have made custom columns and relationships on other auth specific tables such as `roles`, `user_roles`, `auth.refresh_tokens` etc. But you most likely didn't do that.
