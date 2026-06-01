import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Modal from '@/components/Modal/Modal';

const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
];

export default function BarcodeScannerModal({ open, onClose, onScan }) {
  const scannerRef = useRef(null);
  const [error, setError]     = useState('');
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setScanned(false);

    const scanner = new Html5Qrcode('barcode-reader', { formatsToSupport: FORMATS, verbose: false });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 100 } },
        (code) => {
          if (scanned) return;
          setScanned(true);
          onScan(code);
          onClose();
        },
        () => {}
      )
      .catch(() => setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.'));

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop()
          .then(() => { scannerRef.current.clear(); })
          .catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Escanear código de barras" size="sm">
      <div className="p-6 space-y-4">
        <p className="text-sm text-center text-gray-500">
          Apunta la cámara hacia el código de barras del producto
        </p>

        {/* Contenedor del video — html5-qrcode inyecta aquí el <video> */}
        <div
          id="barcode-reader"
          className="w-full overflow-hidden rounded-xl border border-gray-200 bg-black"
          style={{ minHeight: 240 }}
        />

        {error && (
          <p className="text-sm text-red-500 text-center bg-red-50 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </Modal>
  );
}
