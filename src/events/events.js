const express = require('express');
const { Client } = require('pg');

const {
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  PGPORT,
} = require('../config');

let router = express.Router();

router.get('/event_triggers', (req, res, next) => {
  //Connect to the postgres db and fetch all rows from the hdb_catalog.event_triggers table
  const client = new Client()
  await client.connect()
  const result = await client.query(`SELECT * from hdb_catalog.event_triggers`)
  await client.end()
  return res.send(result);
});

router.get('/event_triggers/:trigger_name', (req, res, next) => {
  //Connect to the postgres db and fetch all rows from the hdb_catalog.event_triggers table
  const client = new Client()
  await client.connect()
  const result = await client.query(`SELECT * from hdb_catalog.event_triggers where name = $1`, [req.params.trigger_name])
  await client.end()
  return res.send(result);
});

router.get('/event_logs', (req, res, next) => {
  //Connect to the postgres db and fetch all rows from the hdb_catalog.event_triggers table
  const client = new Client()
  await client.connect()
  const result = await client.query(`SELECT * from hdb_catalog.event_logs`)
  await client.end()
  return res.send(result);
});

router.get('/event_logs/:event_id', (req, res, next) => {
  //Connect to the postgres db and fetch all rows from the hdb_catalog.event_triggers table
  const client = new Client()
  await client.connect()
  const result = await client.query(`SELECT * from hdb_catalog.event_logs where id = $1`, [req.params.event_id])
  await client.end()
  return res.send(result);
});

router.get('/event_invocations', (req, res, next) => {
  //Connect to the postgres db and fetch all rows from the hdb_catalog.event_triggers table
  const client = new Client()
  await client.connect()
  const result = await client.query(`SELECT * from hdb_catalog.event_invocations`)
  await client.end()
  return res.send(result);
});

router.get('/event_invocations/:id', (req, res, next) => {
  //Connect to the postgres db and fetch all rows from the hdb_catalog.event_triggers table
  const client = new Client()
  await client.connect()
  const result = await client.query(`SELECT * from hdb_catalog.event_invocations where id = $1`, [req.params.id])
  await client.end()
  return res.send(result);
});

module.exports = router;
