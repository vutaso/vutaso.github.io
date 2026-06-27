window.Files = (() => {
  const { ACCEPTED_IMAGE_TYPES, ACCEPTED_FILE_EXTENSIONS } = window.APP_CONFIG;

  const getExtension = (name) => {
    const idx = name.lastIndexOf('.');
    return idx >= 0 ? name.slice(idx).toLowerCase() : '';
  };

  const getKind = (file) => {
    if (ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'image';
    const ext = getExtension(file.name);
    if (ACCEPTED_FILE_EXTENSIONS.includes(ext)) return 'document';
    if (file.type === 'application/pdf') return 'document';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'document';
    if (file.type.startsWith('text/')) return 'document';
    return null;
  };

  const readTextFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsText(file, 'UTF-8');
  });

  const ensurePdfWorker = () => {
    if (!window.pdfjsLib) return;
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  };

  const extractPdfText = async (file) => {
    if (!window.pdfjsLib) throw new Error('PDF.js chưa tải');
    ensurePdfWorker();
    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const chunks = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      chunks.push(tc.items.map((x) => x.str).join(' '));
    }
    return chunks.join('\n\n');
  };

  const extractDocxText = async (file) => {
    if (!window.mammoth) throw new Error('Mammoth chưa tải');
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return result.value;
  };

  const extractContent = async (file) => {
    const ext = getExtension(file.name);
    let text;
    if (ext === '.pdf' || file.type === 'application/pdf') {
      text = await extractPdfText(file);
    } else if (
      ext === '.docx'
      || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      text = await extractDocxText(file);
    } else {
      text = await readTextFile(file);
    }
    text = String(text || '').trim();
    if (!text) throw new Error('File không có nội dung đọc được');
    return text;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getIconClass = (name) => {
    const ext = getExtension(name);
    if (ext === '.pdf') return 'fa-file-pdf';
    if (ext === '.csv') return 'fa-file-csv';
    if (['.json', '.xml', '.yaml', '.yml'].includes(ext)) return 'fa-file-code';
    if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.css'].includes(ext)) {
      return 'fa-file-code';
    }
    if (['.doc', '.docx'].includes(ext)) return 'fa-file-word';
    return 'fa-file-lines';
  };

  return { getKind, getExtension, extractContent, formatSize, getIconClass };
})();
