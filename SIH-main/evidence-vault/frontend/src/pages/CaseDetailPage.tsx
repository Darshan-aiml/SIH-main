import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { caseApi, evidenceApi } from '../services/api';
import type { Case, Evidence } from '../types';
import {
  Shield, Upload, ArrowLeft, Calendar, User, Eye, QrCode, RefreshCw, FileText, Image, File, CheckCircle
} from 'lucide-react';

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const loadData = useCallback(() => {
    if (!id) return;
    const caseIdNum = parseInt(id);
    Promise.all([
      caseApi.get(caseIdNum),
      caseApi.getEvidence(caseIdNum),
    ]).then(([c, e]) => {
      setCaseData(c.data);
      setEvidence(e.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !id) return;
    const file = files[0];
    setUploading(true);
    setUploadError('');
    setUploadMsg(`Uploading & encrypting ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('case_id', id);
      formData.append('description', `Case evidence upload: ${file.name}`);

      await evidenceApi.upload(formData);
      setUploadMsg(`✓ ${file.name} registered successfully!`);
      setTimeout(() => {
        setShowUpload(false);
        setUploading(false);
        setUploadMsg('');
        loadData();
      }, 1000);
    } catch (err: any) {
      setUploading(false);
      setUploadError(err.response?.data?.detail || 'Failed to upload evidence');
    }
  };

  const handleVerify = async (evId: number) => {
    setVerifyingId(evId);
    try {
      await evidenceApi.verify(evId);
      loadData();
    } catch { /* ignore */ }
    setVerifyingId(null);
  };

  const fileIcon = (mime: string) => {
    if (mime.includes('pdf')) return <FileText className="w-4 h-4 text-red-400" />;
    if (mime.includes('image')) return <Image className="w-4 h-4 text-emerald-400" />;
    return <File className="w-4 h-4 text-blue-400" />;
  };

  if (loading || !caseData) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-vault-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate('/cases')} className="flex items-center gap-2 text-dark-400 hover:text-dark-200 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Cases
      </button>

      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-vault-400 font-semibold">{caseData.case_number}</span>
            <h1 className="text-xl font-bold text-white mt-1">{caseData.title}</h1>
            <p className="text-sm text-dark-400 mt-2">{caseData.description}</p>
          </div>
          <div className="flex gap-2">
            <span className={`badge ${caseData.priority === 'CRITICAL' ? 'badge-critical' : caseData.priority === 'HIGH' ? 'badge-high' : 'badge-medium'}`}>
              {caseData.priority}
            </span>
            <span className="badge badge-pending">{caseData.status.replace('_', ' ')}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-6 text-sm text-dark-400 pt-4 border-t border-dark-700/50">
          <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-vault-400" /> Lead: {caseData.investigating_officer || 'Investigator'}</span>
          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-vault-400" /> Opened: {new Date(caseData.created_at).toLocaleDateString()}</span>
          <span className="flex items-center gap-1.5 font-semibold text-white"><Shield className="w-4 h-4 text-vault-400" /> Evidence Count: {evidence.length}</span>
        </div>
      </div>

      {/* Evidence Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-vault-400" /> Case Evidence Files ({evidence.length})
          </h2>
          <button
            onClick={() => { setShowUpload(true); setUploadError(''); setUploadMsg(''); }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Upload className="w-4 h-4" /> + Upload Evidence
          </button>
        </div>

        {/* Evidence Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700/50 bg-dark-800/40">
                  <th className="text-left py-3 px-4 text-dark-400 font-medium text-xs uppercase">Evidence ID</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium text-xs uppercase">Filename</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium text-xs uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium text-xs uppercase">Uploaded By</th>
                  <th className="text-center py-3 px-4 text-dark-400 font-medium text-xs uppercase">Version</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium text-xs uppercase">Integrity</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium text-xs uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-dark-400 font-medium text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {evidence.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => navigate(`/evidence/${ev.id}`)}
                    className="border-b border-dark-800/50 hover:bg-dark-800/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-vault-400 text-xs font-semibold">{ev.evidence_id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {fileIcon(ev.mime_type)}
                        <span className="text-dark-200 font-medium truncate max-w-[200px]" title={ev.original_filename}>
                          {ev.original_filename}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge bg-vault-600/15 text-vault-400 border border-vault-600/25 text-[11px]">
                        {ev.classification || ev.evidence_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-dark-300">{ev.uploaded_by_name || 'Investigator'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-dark-800 text-dark-300 border border-dark-700">
                        v{ev.current_version}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge text-[11px] ${
                        ev.integrity_status === 'VERIFIED' ? 'badge-verified' : ev.integrity_status === 'TAMPERED' ? 'badge-tampered' : 'badge-pending'
                      }`}>
                        {ev.integrity_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-dark-400">{ev.status || 'REGISTERED'}</td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/evidence/${ev.id}`)}
                          className="p-1.5 rounded hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/evidence/${ev.id}/passport`)}
                          className="p-1.5 rounded hover:bg-dark-700 text-vault-400 hover:text-vault-300 transition-colors"
                          title="Evidence Passport"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleVerify(ev.id)}
                          disabled={verifyingId === ev.id}
                          className="p-1.5 rounded hover:bg-dark-700 text-emerald-400 hover:text-emerald-300 transition-colors"
                          title="Verify Integrity"
                        >
                          {verifyingId === ev.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {evidence.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-dark-400">
                      <Shield className="w-10 h-10 text-dark-600 mx-auto mb-2" />
                      No evidence files uploaded to this case yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card p-6 w-full max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-vault-400" /> Upload Evidence to {caseData.case_number}
            </h2>
            <p className="text-xs text-dark-400 mb-4">Case: {caseData.title}</p>

            <div className="border-2 border-dashed border-dark-600 rounded-xl p-8 text-center hover:border-vault-500 transition-all">
              <Upload className="w-10 h-10 text-vault-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-dark-200 mb-1">Select evidence file to upload</p>
              <p className="text-xs text-dark-500 mb-4">PDF, PNG, JPG, JPEG, DOCX, TXT • Max 25 MB</p>

              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.docx,.txt"
                onChange={(e) => handleUpload(e.target.files)}
                className="text-xs text-dark-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-vault-600 file:text-white file:text-xs file:font-semibold file:cursor-pointer"
              />
            </div>

            {uploadMsg && (
              <div className="mt-4 p-3 rounded-lg bg-vault-600/10 border border-vault-500/30 text-vault-300 text-xs flex items-center gap-2">
                {uploading ? <RefreshCw className="w-4 h-4 animate-spin text-vault-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                <span>{uploadMsg}</span>
              </div>
            )}

            {uploadError && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {uploadError}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowUpload(false); setUploadMsg(''); setUploadError(''); }}
                disabled={uploading}
                className="btn-secondary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
