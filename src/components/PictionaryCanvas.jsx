import React, { useRef, useState, useEffect } from 'react';
import { 
  PenTool, 
  Eraser, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Palette, 
  Download,
  Eye
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function PictionaryCanvas({ isReadOnly = false, onStrokeDraw }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'
  const [color, setColor] = useState('#00e5ff'); // bright cyan
  const [lineWidth, setLineWidth] = useState(4);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const { socket } = useSocket();

  const colors = [
    '#ffffff', // White
    '#00e5ff', // Cyan
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#eab308', // Yellow
    '#22c55e', // Green
    '#ef4444', // Red
    '#f97316', // Orange
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Fill background dark slate
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state in history
    setHistory([canvas.toDataURL()]);
  }, []);

  // Listen to incoming live strokes from socket if viewer
  useEffect(() => {
    if (!socket) return;

    const handleRemoteStroke = (stroke) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      ctx.beginPath();
      ctx.moveTo(stroke.fromX, stroke.fromY);
      ctx.lineTo(stroke.toX, stroke.toY);
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#090d16' : stroke.color;
      ctx.lineWidth = stroke.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    };

    const handleRemoteClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    socket.on('draw_stroke', handleRemoteStroke);
    socket.on('clear_canvas', handleRemoteClear);

    return () => {
      socket.off('draw_stroke', handleRemoteStroke);
      socket.off('clear_canvas', handleRemoteClear);
    };
  }, [socket]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const lastCoord = useRef({ x: 0, y: 0 });

  const startDrawing = (e) => {
    if (isReadOnly) return;
    const { x, y } = getCoordinates(e);
    lastCoord.current = { x, y };
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || isReadOnly) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    const fromX = lastCoord.current.x;
    const fromY = lastCoord.current.y;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? '#090d16' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Broadcast stroke to other clients
    const strokeData = {
      fromX,
      fromY,
      toX: x,
      toY: y,
      color,
      tool,
      lineWidth: tool === 'eraser' ? lineWidth * 3 : lineWidth
    };

    if (socket) {
      socket.emit('draw_stroke', strokeData);
    }
    if (onStrokeDraw) {
      onStrokeDraw(strokeData);
    }

    lastCoord.current = { x, y };
  };

  const stopDrawing = () => {
    if (!isDrawing || isReadOnly) return;
    setIsDrawing(false);

    // Save snapshot for undo
    const canvas = canvasRef.current;
    if (canvas) {
      setHistory((prev) => [...prev.slice(-15), canvas.toDataURL()]);
      setRedoStack([]);
    }
  };

  const handleClear = () => {
    if (isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (socket) {
      socket.emit('clear_canvas');
    }
    setHistory((prev) => [...prev, canvas.toDataURL()]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (isReadOnly || history.length <= 1) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const current = history[history.length - 1];
    const previous = history[history.length - 2];

    const img = new Image();
    img.src = previous;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setRedoStack((prev) => [current, ...prev]);
      setHistory((prev) => prev.slice(0, -1));
    };
  };

  const handleRedo = () => {
    if (isReadOnly || redoStack.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const nextState = redoStack[0];
    const img = new Image();
    img.src = nextState;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistory((prev) => [...prev, nextState]);
      setRedoStack((prev) => prev.slice(1));
    };
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-3">
      {/* Controls Bar */}
      {!isReadOnly ? (
        <div className="flex flex-wrap items-center justify-between gap-3 w-full p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          {/* Tool buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                tool === 'pen' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <PenTool className="w-4 h-4" />
              Pen
            </button>

            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                tool === 'eraser' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Eraser className="w-4 h-4" />
              Eraser
            </button>
          </div>

          {/* Color palette */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950 rounded-xl border border-slate-800">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setTool('pen');
                }}
                className={`w-6 h-6 rounded-full transition-transform ${
                  color === c && tool === 'pen' ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-950' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Stroke Width */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Size:</span>
            <input
              type="range"
              min="2"
              max="16"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20 accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Action buttons: Undo, Redo, Clear */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              className="p-2 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-500/30 hover:bg-rose-900/60"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400 animate-pulse" />
            Audience / Live Broadcast Mode (Real-Time Synced)
          </span>
          <span className="text-emerald-400 font-bold">● LIVE STREAM</span>
        </div>
      )}

      {/* Drawing Canvas */}
      <div className="relative w-full rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-2xl shadow-black/80 bg-[#090d16]">
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full aspect-[5/3] block touch-none ${
            isReadOnly ? 'cursor-default' : tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'
          }`}
        />
      </div>
    </div>
  );
}
