// Validador de body sin dependencias externas.
// Cada campo del schema acepta: { required, type, minLength, maxLength, isEmail, enum }
function validateBody(schema) {
  return (req, res, next) => {
    const body = req.body || {};
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];
      const present = value !== undefined && value !== null && value !== '';

      if (rules.required && !present) {
        errors.push(`${field} es requerido`);
        continue;
      }
      if (!present) continue; // opcional y ausente: no se valida más

      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} debe ser texto`);
        continue;
      }
      if (rules.type === 'number' && (typeof value !== 'number' || Number.isNaN(value))) {
        errors.push(`${field} debe ser numérico`);
        continue;
      }
      if (rules.minLength && String(value).trim().length < rules.minLength) {
        errors.push(`${field} debe tener al menos ${rules.minLength} caracteres`);
      }
      if (rules.maxLength && String(value).length > rules.maxLength) {
        errors.push(`${field} no puede superar ${rules.maxLength} caracteres`);
      }
      if (rules.isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${field} no es un email válido`);
      }
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} debe ser uno de: ${rules.enum.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join('. ') });
    }
    next();
  };
}

module.exports = validateBody;
