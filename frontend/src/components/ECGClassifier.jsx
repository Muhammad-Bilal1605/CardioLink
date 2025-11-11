import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5226'

function ECGClassifier() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const onFileChange = (e) => {
    const selected = e.target.files?.[0] || null
    setResult(null)
    setError('')
    if (!selected) {
      setFile(null)
      return
    }
    const lower = selected.name.toLowerCase()
    const isAllowedType = (
      selected.type === 'image/png' ||
      selected.type === 'image/jpeg' ||
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg')
    )
    if (!isAllowedType) {
      setFile(null)
      setError('Please upload a PNG or JPEG image (.png, .jpg, .jpeg) for ECG analysis.')
      return
    }
    setFile(selected)
  }

  const onPredict = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_BASE}/predict`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Prediction failed')
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onDownloadReport = async () => {
    if (!file || !result) return
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('predictedClass', result.topClass)
      form.append('confidence', String(result.confidence))
      const res = await fetch(`${API_BASE}/report`, { method: 'POST', body: form })
      if (!res.ok) {
        const maybeJson = await res.json().catch(() => null)
        throw new Error(maybeJson?.error || 'Report generation failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${result.topClass}_report.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <h1 className="text-xl md:text-2xl font-bold text-white">ECG Image Classifier</h1>
          <p className="text-blue-100 text-sm mt-1">Upload an ECG image to classify and download a PDF report.</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <label className="inline-flex items-center justify-center w-full md:w-auto px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3a2 2 0 012-2h3a1 1 0 010 2H5v12h10V3h-3a1 1 0 110-2h3a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V3z"/><path d="M9 7a1 1 0 112 0v3.586l1.293-1.293a1 1 0 011.414 1.414L10 13l-3.707-3.293a1 1 0 111.414-1.414L9 10.586V7z"/></svg>
              Choose ECG Image
              <input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" className="hidden" onChange={onFileChange} />
            </label>

            <div className="flex gap-2">
              <button
                disabled={!file || loading}
                onClick={onPredict}
                className={`px-4 py-2.5 text-sm font-medium rounded-md text-white transition-colors ${(!file || loading) ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? 'Predicting...' : 'Predict'}
              </button>
              <button
                disabled={!result || loading}
                onClick={onDownloadReport}
                className={`px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${(!result || loading) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
              >
                Download Report
              </button>
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-700">
              <div className="truncate">
                <span className="font-medium">Selected:</span> <span className="truncate inline-block max-w-[16rem] align-bottom">{file.name}</span>
              </div>
              <span className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {result && (
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Prediction</h3>
                <div className="text-sm text-gray-600">Confidence: <span className="font-semibold text-gray-900">{(result.confidence * 100).toFixed(2)}%</span></div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-green-900 font-semibold">{result.topClass}</div>
                  <div className="text-green-800 font-medium">High Confidence</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Confidence Breakdown</h4>
                <ul className="space-y-2">
                  {result.classes.map((c, i) => {
                    const pct = (result.probabilities[i] * 100)
                    return (
                      <li key={c} className="">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span className="font-medium text-gray-800">{c}</span>
                          <span>{pct.toFixed(2)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded">
                          <div className="h-2 bg-blue-600 rounded" style={{ width: `${pct}%` }}></div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ECGClassifier


