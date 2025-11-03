export const notFound = (_req, res, _next) =>
  res.status(404).json({ success: false, error: 'Not found' });

export const errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal error';
  res.status(status).json({ success: false, error: message });
};