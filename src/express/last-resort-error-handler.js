/***
 * When nothing else catches an error, this function catches and logs it
 */
module.exports = (err, req, res) => {
  const traceId = req.context?.traceId ?? 'none';
  console.error(traceId, err);
  
  return res.status(500).send('error');
};
  