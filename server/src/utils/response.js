export const ok = (res, data, status = 200) => {
  return res.status(status).json({ success: true, data });
};

export const fail = (res, error, status = 400, details = null) => {
  const response = { success: false, error };
  if (details) response.details = details;
  return res.status(status).json(response);
};
