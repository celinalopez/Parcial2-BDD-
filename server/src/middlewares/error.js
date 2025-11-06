export const notFound = (_req, res, _next) =>
  res.status(404).json({ success: false, error: 'Not found' });

export const errorHandler = (err, _req, res, _next) => {
  // Duplicado Mongo (E11000)
  if (err?.code === 11000) {
    return res.status(409).json({ success: false, error: 'Duplicado: valor unico ya existe', details: err.keyValue });
  }
  // Validaciones Mongoose
  if (err?.name === 'ValidationError') {
    return res.status(400).json({ success: false, error: 'Validacion fallida', details: err.errors });
  }

  // Errores de cast (ObjectId invalido)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: `ID inválido (${err.path})`
    });
  }

  // Default: error interno
  res.status(500).json({
    success: false,
    error: err.message || "Error interno del servidor"
  });
  
  const status = err.status || 500;
  const message = err.message || 'Internal error';
  res.status(status).json({ success: false, error: message });
};
