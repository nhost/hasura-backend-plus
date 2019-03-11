exports.storagePermission = (key, type, claims) => {
  let res;

  // remove first / in key, if any
  key = key.replace(/^\/+/g, '');

  // match key with a hasura claim (company-id)
  res = key.match(/\/companies\/(?<company_id>\w*)\/customers\/(\d*)\/.*/);
  if (res) {
    if (claims['x-hasura-company-id'] === res.groups.company_id) {
      return true;
    }
    return false;
  }

  // accept read to public directory
  res = key.match(/public\/.*/);
  if (res) {
    if (type === 'read') {
      return true;
    }
  }

  return false;
};
