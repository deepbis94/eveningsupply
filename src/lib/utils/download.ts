export function downloadCsv(fileName: string, rows: Array<Array<string | number>>) {
  const csv = rows
    .map(row => row.map(escapeCsvCell).join(','))
    .join('\n')

  downloadBlob(csv, withExportTimestamp(fileName), 'text/csv;charset=utf-8;')
}

export function downloadBlob(blobData: BlobPart, fileName: string, mimeType: string) {
  const finalName = ensureFileExtension(fileName, mimeType)

  // octet-stream keeps the extension visible in macOS Chrome/Safari "Save As".
  const file = new File([blobData], finalName, {
    type: 'application/octet-stream',
    lastModified: Date.now(),
  })

  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()

  window.setTimeout(() => {
    if (link.parentNode) {
      link.parentNode.removeChild(link)
    }
    URL.revokeObjectURL(url)
  }, 2000)
}

export function getExportFileName(contentDisposition: string | undefined, fallback: string) {
  const parsed = parseContentDispositionFileName(contentDisposition)
  const candidate = parsed || withExportTimestamp(fallback)

  return ensureFileExtension(candidate, extensionFromFileName(fallback))
}

export function withExportTimestamp(fileName: string, at: Date = new Date()) {
  const stamp = [
    at.getFullYear(),
    String(at.getMonth() + 1).padStart(2, '0'),
    String(at.getDate()).padStart(2, '0'),
    '-',
    String(at.getHours()).padStart(2, '0'),
    String(at.getMinutes()).padStart(2, '0'),
    String(at.getSeconds()).padStart(2, '0'),
  ].join('')

  const extension = extensionFromFileName(fileName)
  const baseName = extension
    ? fileName.slice(0, fileName.length - extension.length)
    : fileName

  return `${baseName}-${stamp}${extension}`
}

function parseContentDispositionFileName(contentDisposition: string | undefined) {
  if (!contentDisposition) {
    return ''
  }

  const utf8Match = contentDisposition.match(/filename\*\s*=\s*(?:UTF-8''|utf-8'')([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^["']|["']$/g, ''))
    } catch {
      return utf8Match[1].trim().replace(/^["']|["']$/g, '')
    }
  }

  const basicMatch = contentDisposition.match(/filename\s*=\s*("?)([^";]+)\1/i)
  return basicMatch?.[2]?.trim() ?? ''
}

function extensionFromFileName(fileName: string) {
  const match = fileName.match(/(\.[A-Za-z0-9]+)$/)
  return match?.[1] ?? ''
}

function ensureFileExtension(fileName: string, extensionOrMime: string) {
  const cleaned = fileName.trim().replace(/^["']|["']$/g, '')
  if (extensionFromFileName(cleaned)) {
    return cleaned
  }

  const extension = extensionOrMime.startsWith('.')
    ? extensionOrMime
    : mimeToExtension(extensionOrMime)

  return extension ? `${cleaned}${extension}` : cleaned
}

function mimeToExtension(mimeType: string) {
  if (mimeType.includes('csv')) return '.csv'
  if (mimeType.includes('pdf')) return '.pdf'
  return ''
}

function escapeCsvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`
}
