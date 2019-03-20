exports.storagePermission = (key, type, claims) => {
  let res;

  console.log(key);
  console.log(type);
  console.log(claims);

  // remove first / in key, if any
  key = key.replace(/^\/+/g, '');

  // accept read to public directory
  res = key.match(/public\/.*/);
  if (res) {
    if (type === 'read' || type === 'write') {
      return true;
    }
  }

  return false;
};
