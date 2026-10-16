import axios from 'axios';

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || '';
export const BACKEND_BASE = RAW_BASE.replace(/\/$/, '');
const API_BASE = `${BACKEND_BASE}/api`;

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
    return path;
  }
  return `${BACKEND_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const getCropSampleFallback = (cropName) => {
  const c = String(cropName || '').toLowerCase();
  if (c.includes('coconut')) return '/samples/sample_coconut_palm.jpg';
  if (c.includes('cotton')) return '/samples/sample_cotton_boll.jpg';
  if (c.includes('groundnut') || c.includes('peanut')) return '/samples/sample_groundnut_pod.jpg';
  return '/samples/sample_paddy_tillering.jpg';
};



export const api = {
  // Search survey numbers
  async searchSurveys(query = '') {
    const res = await axios.get(`${API_BASE}/parcels/search`, {
      params: { q: query }
    });
    return res.data;
  },

  // Get full parcel data by exact survey number
  async getParcel(surveyNumber) {
    const res = await axios.get(`${API_BASE}/parcels/${surveyNumber}`);
    return res.data;
  },

  // Run full LangGraph agent advisory pipeline
  async runAdvisory(surveyNumber, query = '', imageFilename = null) {
    const formData = new FormData();
    formData.append('survey_number', surveyNumber);
    if (query) formData.append('query', query);
    if (imageFilename) formData.append('image_filename', imageFilename);

    const res = await axios.post(`${API_BASE}/advisory/run`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000
    });
    return res.data;
  },

  // Upload field photo
  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axios.post(`${API_BASE}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // AI Chatbot with optional photo
  async chatAdvisor(message, surveyNumber = null, imageFile = null) {
    const formData = new FormData();
    formData.append('message', message);
    if (surveyNumber) formData.append('survey_number', surveyNumber);
    if (imageFile) formData.append('image', imageFile);

    const res = await axios.post(`${API_BASE}/chat`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Market commodity prices
  async getMarketPrices(crop = '') {
    const res = await axios.get(`${API_BASE}/market/prices`, {
      params: { crop }
    });
    return res.data;
  },

  // Micro-climate weather
  async getWeather(surveyNumber) {
    const res = await axios.get(`${API_BASE}/weather/parcel/${surveyNumber}`);
    return res.data;
  },

  // System Health
  async getHealth() {
    const res = await axios.get(`${API_BASE}/health`);
    return res.data;
  },

  // Voice: transcribe audio blob via Groq Whisper
  async transcribeVoice(audioBlob, language = 'en') {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    if (language) formData.append('language', language);
    const res = await axios.post(`${API_BASE}/voice/transcribe`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000
    });
    return res.data; // { text, status, model, source }
  },

  // Advisory: translate English summary to Tamil via Gemini
  async translateAdvisory(text, targetLang = 'ta') {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('target_lang', targetLang);
    const res = await axios.post(`${API_BASE}/advisory/translate`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000
    });
    return res.data; // { original_text, translated_text, language }
  }
};
