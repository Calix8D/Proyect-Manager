// Respondedor de errores centralizado para los controladores.
// Los errores "conocidos" del dominio se lanzan como { status, message } → su
// mensaje es seguro de mostrar. Cualquier otro error (SQL, bugs, etc.) se registra
// en el servidor y se responde genérico para no filtrar detalles internos.
function sendError(res, err) {
  if (err && err.status) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  console.error(err);
  return res.status(500).json({ success: false, message: 'Error interno del servidor' });
}

module.exports = { sendError };
