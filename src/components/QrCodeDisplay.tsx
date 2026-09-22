"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export function QrCodeDisplay({ turmaId, titulo }: { turmaId: string; titulo: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Começa vazio no servidor (window não existe lá) e só ganha valor depois
  // de montar no cliente — senão o texto renderizado no servidor (vazio)
  // diverge do primeiro render no cliente (com a URL), causando erro de
  // hydration. Isso é exatamente o tipo de sincronização com um sistema
  // externo (window.location) que um efeito existe pra fazer.
  const [url, setUrl] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- window.location só existe no cliente, precisa de um efeito pra sincronizar
    setUrl(`${window.location.origin}/checkin/${turmaId}`);
  }, [turmaId]);

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, { width: 280, margin: 1 });
    }
  }, [url]);

  return (
    <div className="card p-6 flex flex-col items-center gap-3 text-center max-w-xs mx-auto">
      <p className="font-semibold text-zosa-ink">{titulo}</p>
      <canvas ref={canvasRef} />
      <p className="text-xs text-zosa-muted break-all">{url}</p>
      <button onClick={() => window.print()} className="btn-secondary no-print">
        Imprimir
      </button>
    </div>
  );
}
