import { useState } from 'react';
import { exportGlossary, importGlossary } from '../lib/glossaryStore';

export default function GlossaryImportExport() {
  const [isOpen, setIsOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleExport = () => {
    const json = exportGlossary();
    navigator.clipboard.writeText(json).then(() => {
      alert('辞書をクリップボードにコピーしました');
    }).catch(() => {
      alert('コピーに失敗しました');
    });
  };

  const handleImport = () => {
    setImportError(null);
    setImportSuccess(false);
    
    if (!importText.trim()) {
      setImportError('JSONを入力してください');
      return;
    }
    
    const result = importGlossary(importText);
    if (result.success) {
      setImportSuccess(true);
      setImportText('');
      setTimeout(() => {
        setImportSuccess(false);
        setIsOpen(false);
        window.location.reload(); // 辞書を再読み込み
      }, 1500);
    } else {
      setImportError(result.error || 'インポートに失敗しました');
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 16px',
          background: '#607d8b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        辞書管理
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>
              カード辞書のインポート/エクスポート
            </h2>

            {/* エクスポート */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>エクスポート</h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                現在の辞書をJSON形式でコピーします
              </p>
              <button
                onClick={handleExport}
                style={{
                  padding: '10px 20px',
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                辞書をコピー
              </button>
            </div>

            {/* インポート */}
            <div>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>インポート</h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                JSON形式の辞書を貼り付けてインポートします（既存の辞書とマージされます）
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='{"カード名": {"summary": "...", "timing": "...", "notes": "...", "typeCategory": "monster", "url": "...", "monster": {"attribute": "闇", "level": 4, "race": "戦士族", "type": "効果", "atk": 2000, "def": 1800}}, ...}'
                style={{
                  width: '100%',
                  height: '200px',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  marginBottom: '12px',
                }}
              />
              {importError && (
                <div style={{ color: '#f44336', fontSize: '14px', marginBottom: '8px' }}>
                  エラー: {importError}
                </div>
              )}
              {importSuccess && (
                <div style={{ color: '#4caf50', fontSize: '14px', marginBottom: '8px' }}>
                  インポート成功！ページを再読み込みします...
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleImport}
                  style={{
                    padding: '10px 20px',
                    background: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  インポート
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setImportText('');
                    setImportError(null);
                    setImportSuccess(false);
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#999',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>

            <div style={{ marginTop: '20px', padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px', color: '#666' }}>
              <strong>注意:</strong> 端末を変えると同期されません。将来DB同期機能を追加予定です。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
