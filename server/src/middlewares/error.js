export const notFound = (_req, res, _next) =>
  res.status(404).json({ success: false, error: 'Not found' });

export const errorHandler = (err, _req, res, _next) => {
  // Duplicado Mongo (E11000)
  if (err?.code === 11000) {
    return res.status(409).json({ success: false, error: 'Duplicado: valor único ya existe', details: err.keyValue });
  }
  // Validaciones Mongoose
  if (err?.name === 'ValidationError') {
    return res.status(400).json({ success: false, error: 'Validación fallida', details: err.errors });
  }
  const status = err.status || 500;
  const message = err.message || 'Internal error';
  res.status(status).json({ success: false, error: message });
};
