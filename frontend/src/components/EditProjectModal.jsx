import { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import api from '../api';

export default function EditProjectModal({ project, onClose, onSave }) {
  const [formData, setFormData] = useState({
    project_image: project.project_image || '',
    website_url: project.website_url || '',
    presentation_url: project.presentation_url || '',
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData(prev => ({ ...prev, project_image: ev.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, project_image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChangeImage = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.patch(`/projects/${project.id}`, formData);
      onSave(response.data);
      onClose();
    } catch (err) {
      console.error('Error updating project:', err);
      alert('Error updating project: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9998,
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--border)',
        maxWidth: 500,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.3rem' }}>Editar Proyecto</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Image Upload */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
              Imagen del Proyecto
            </label>
            {formData.project_image ? (
              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <img 
                  src={formData.project_image} 
                  alt="Project preview" 
                  style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'var(--r-md)' }} 
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleChangeImage}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: 'var(--r-sm)',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--text-secondary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    Cambiar imagen
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: 'var(--r-sm)',
                      background: 'rgba(200, 100, 100, 0.1)',
                      border: '1px solid rgba(200, 100, 100, 0.3)',
                      color: '#c86464',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(200, 100, 100, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(200, 100, 100, 0.3)';
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={handleChangeImage}
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--r-md)',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'var(--surface-2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--yellow)';
                  e.currentTarget.style.background = 'rgba(245, 193, 55, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--surface-2)';
                }}
              >
                <Upload size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Haz clic para subir una imagen
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
          </div>

          {/* Website URL */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
              Sitio Web
            </label>
            <input
              type="url"
              placeholder="https://ejemplo.com"
              value={formData.website_url}
              onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.7rem',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--yellow)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            />
          </div>

          {/* Presentation URL */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
              Link de Presentación
            </label>
            <input
              type="url"
              placeholder="https://ejemplo.com/presentacion"
              value={formData.presentation_url}
              onChange={(e) => setFormData(prev => ({ ...prev, presentation_url: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.7rem',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--yellow)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            />
          </div>

          {/* Info message */}
          <div style={{
            padding: '0.75rem',
            borderRadius: 'var(--r-sm)',
            background: 'rgba(100, 150, 200, 0.1)',
            border: '1px solid rgba(100, 150, 200, 0.3)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}>
            <strong>Nota:</strong> Solo puedes editar la imagen, sitio web y link de presentación. Los términos de la inversión original se mantienen sin cambios.
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.7rem 1.25rem',
                borderRadius: 'var(--r-md)',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                opacity: loading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.borderColor = 'var(--text-secondary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.7rem 1.5rem',
                borderRadius: 'var(--r-md)',
                background: 'var(--grad-yellow-btn)',
                border: 'none',
                color: '#05070F',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Guardando...' : '✓ Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
