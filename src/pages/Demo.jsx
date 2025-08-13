import { useEffect, useRef, useState } from 'react';
import PoseCanvas from '../components/PoseCanvas';
import RecorderControls from '../components/RecorderControls';

export default function Demo({ mode = 'record' }) {
  const isLive = mode === 'live';

  const canvasRef = useRef(null);

  const [overlay, setOverlay] = useState({ countdown: 0, isRecording: false, timeLeft: 0 });

  const [playbackUrl, setPlaybackUrl] = useState(null);
  const hasPlayback = !!playbackUrl;

  const W = isLive ? 1280 : 693;
  const H = isLive ? 580 : 520;

  // Clear blob URL on change/unmount
  useEffect(() => {
    return () => {
      if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    };
  }, [playbackUrl]);

  // Clear when switching to Live
  useEffect(() => {
    if (isLive && playbackUrl) {
      URL.revokeObjectURL(playbackUrl);
      setPlaybackUrl(null);
    }
    if (isLive) setOverlay({ countdown: 0, isRecording: false, timeLeft: 0 });
  }, [isLive]);

  const handlePlaybackReady = (url) => setPlaybackUrl(url);

  const handleRetake = () => {
    if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    setPlaybackUrl(null);
    setOverlay({ countdown: 0, isRecording: false, timeLeft: 0 });
  };

  return (
    <div style={{ maxWidth: W, margin: '0 auto', textAlign: 'center' }}>
      <h2 className="display-6 fw-semibold text-dark mb-3">
        {isLive ? 'Live Feedback' : 'Pose Recording'}
      </h2>
      <h3 className="lead text-body-secondary" style={{ marginBottom: 12 }}>
        {isLive
          ? 'Get real-time feedback on your movement.'
          : playbackUrl
            ? 'Watch your recording below.'
            : 'Record a short video of yourself moving.'}
      </h3>

      <div style={{ width: W, height: H, margin: '0 auto' }}>
        {hasPlayback ? (
          <video
            src={playbackUrl}
            controls
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              background: '#000',
              borderRadius: 8,
            }}
          />
        ) : (
          <PoseCanvas
            width={W}
            height={H}
            canvasRef={canvasRef}
            overlay={isLive ? null : overlay}
            mode={mode}
          />
        )}
      </div>

      {/* Action buttons */}
      {hasPlayback ? (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <a href={playbackUrl} download="posenet-recording.webm" className="btn btn-primary">
            <i class="bi bi-download"></i> Download
          </a>
          <button type="button" onClick={handleRetake} className="btn btn-danger">
            <i class="bi bi-arrow-counterclockwise"></i> Delete and Retake
          </button>
        </div>
      ) : (
        !isLive && (
          <div style={{ marginTop: 12 }}>
            <RecorderControls
              canvasRef={canvasRef}
              onOverlayChange={setOverlay}
              defaultPrep={3}
              defaultRecord={10}
              onPlaybackReady={handlePlaybackReady}
              onBeginRecording={() => {
                if (playbackUrl) {
                  URL.revokeObjectURL(playbackUrl);
                  setPlaybackUrl(null);
                }
              }}
            />
          </div>
        )
      )}
    </div>
  );
}
