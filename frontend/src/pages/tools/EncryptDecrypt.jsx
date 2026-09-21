import { useState } from 'react'
import { encryptValue, decryptValue } from '../../api/encrypt.js'
import { Key } from '../../components/icons.jsx'
import CopyButton from '../../components/CopyButton.jsx'

const card = 'rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] shadow-sm'
const inputCls = 'w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-3 py-2.5 text-sm font-mono outline-none focus:border-blue-500'

export default function EncryptDecrypt() {
  const [value, setValue] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState('') // 'encrypt' | 'decrypt' — which produced the current result
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (kind) => {
    setError(''); setResult('')
    if (!value.trim()) { setError('Please enter a value.'); return }
    setBusy(true)
    try {
      const data = kind === 'encrypt' ? await encryptValue(value) : await decryptValue(value)
      setResult(data.result ?? '')
      setMode(kind)
    } catch (e) {
      setError(e?.response?.data?.message || 'Operation failed.')
    } finally {
      setBusy(false)
    }
  }

  const useResultAsInput = () => { setValue(result); setResult(''); setMode('') }

  return (
    <div className="w-full space-y-5 max-w-3xl mx-auto">
      {/* Title */}
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0"><Key size={18} /></span>
        <div>
          <h1 className="text-xl font-bold leading-tight">Encrypt / Decrypt</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">ERP-compatible value encoder (TripleDES)</p>
        </div>
      </div>

      {/* Input */}
      <div className={`${card} p-4 sm:p-5 space-y-3`}>
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 block">Value</label>
        <textarea rows={3} value={value} onChange={(e) => setValue(e.target.value)}
          placeholder="Enter text to encrypt, or an encrypted value to decrypt…"
          className={inputCls} />

        {error && <div className="text-sm font-bold text-red-600 dark:text-red-400">{error}</div>}

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => run('encrypt')} disabled={busy}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold">
            🔒 Encrypt
          </button>
          <button type="button" onClick={() => run('decrypt')} disabled={busy}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold">
            🔓 Decrypt
          </button>
          <button type="button" onClick={() => { setValue(''); setResult(''); setError(''); setMode('') }} disabled={busy}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5">
            Clear
          </button>
        </div>
      </div>

      {/* Result */}
      {result !== '' && (
        <div className={`${card} p-4 sm:p-5 space-y-3`}>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {mode === 'encrypt' ? 'Encrypted' : 'Decrypted'} result
            </label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={useResultAsInput}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Use as input ↑</button>
              <CopyButton text={result} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0d0f18] px-3 py-2.5 text-sm font-mono break-all select-all">
            {result}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        Uses the same algorithm as the ERP EncryptandDecrypt tool (TripleDES · ECB · key from MD5), so values stay compatible.
      </p>
    </div>
  )
}
