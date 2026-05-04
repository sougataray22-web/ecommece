const success = (res, data = {}, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ ok: true, message, ...data });

const error = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  const body = { ok: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, error };
