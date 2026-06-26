const axios = require('axios');
const { reportsServiceUrl } = require('../../config/env');

const reportsClient = axios.create({ baseURL: reportsServiceUrl });

function authHeader(req) {
  return { headers: { Authorization: req.headers.authorization } };
}

async function summary(req, res) {
  try {
    const { data } = await reportsClient.get(
      `/reports/project/${req.params.id}/summary`,
      authHeader(req)
    );
    res.json(data);
  } catch (err) {
    const status  = err.response?.status  || 502;
    const message = err.response?.data?.detail || 'Error en el servicio de reportes';
    res.status(status).json({ success: false, message });
  }
}

async function workload(req, res) {
  try {
    const { data } = await reportsClient.get(
      `/reports/project/${req.params.id}/workload`,
      authHeader(req)
    );
    res.json(data);
  } catch (err) {
    const status  = err.response?.status  || 502;
    const message = err.response?.data?.detail || 'Error en el servicio de reportes';
    res.status(status).json({ success: false, message });
  }
}

async function overdue(req, res) {
  try {
    const { data } = await reportsClient.get(
      `/reports/project/${req.params.id}/overdue`,
      authHeader(req)
    );
    res.json(data);
  } catch (err) {
    const status  = err.response?.status  || 502;
    const message = err.response?.data?.detail || 'Error en el servicio de reportes';
    res.status(status).json({ success: false, message });
  }
}

async function exportExcel(req, res) {
  try {
    const response = await reportsClient.get(
      `/reports/project/${req.params.id}/export`,
      { ...authHeader(req), responseType: 'stream' }
    );
    res.setHeader('Content-Type',        response.headers['content-type']);
    res.setHeader('Content-Disposition', response.headers['content-disposition']);
    response.data.pipe(res);
  } catch (err) {
    const status = err.response?.status || 502;
    res.status(status).json({ success: false, message: 'Error al generar el Excel' });
  }
}

module.exports = { summary, workload, overdue, exportExcel };
