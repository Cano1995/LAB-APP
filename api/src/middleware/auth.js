const { verificarToken, buscarUsuarioPorId } = require('../modules/auth/auth.service');

// Exige un JWT de acceso válido y carga req.usuario.
async function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  let p;
  try {
    p = verificarToken(token);
  } catch {
    return res.status(401).json({ error: 'Token inválido o vencido' });
  }
  if (p.typ !== 'access') return res.status(401).json({ error: 'Token inválido' });
  try {
    const u = await buscarUsuarioPorId(p.sub);
    if (!u || u.USE_ATIVO !== '1') return res.status(401).json({ error: 'Usuario no disponible' });
    req.usuario = { id: u.ID_USUARIO, usuario: u.DSC_USUARIO, nombre: u.USE_NOME, master: u.USE_MASTER === '1' };
    next();
  } catch (e) {
    // Falla de la base (pool saturado, recarga de DESA…): no es un token inválido, para que el cliente no cierre la sesión.
    console.error('[auth] no se pudo consultar al usuario:', e.message);
    return res.status(503).json({ error: 'Servicio no disponible, reintente en unos segundos' });
  }
}

module.exports = { requireAuth };
