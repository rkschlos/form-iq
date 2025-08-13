import { useEffect, useRef, useState } from 'react';

export default function RecorderControls({
  canvasRef,
  onOverlayChange,
  defaultPrep = 3,
  defaultRecord = 10,
  onPlaybackReady,
  onBeginRecording,
}) {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const canvasStreamRef = useRef(null);

  // refs to manage intervals
  const prepTimerIdRef = useRef(null);
  const recordTimerIdRef = useRef(null);
  const autoStopTimerIdRef = useRef(null);

  const [prepSeconds, setPrepSeconds] = useState(defaultPrep);
  const [recordSeconds, setRecordSeconds] = useState(defaultRecord);
  // timer states
  const [countdown, setCountdown] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // keep PoseCanvas overlay in sync
  useEffect(() => {
    onOverlayChange?.({ countdown, isRecording, timeLeft });
  }, [countdown, isRecording, timeLeft, onOverlayChange]);

  // clear up any existing intervals or timeouts
  useEffect(() => {
    return () => {
      clearInterval(prepTimerIdRef.current);
      clearInterval(recordTimerIdRef.current);
      clearTimeout(autoStopTimerIdRef.current);

      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== 'inactive') mr.stop();
      canvasStreamRef.current?.getTracks().forEach((t) => t.stop());
      canvasStreamRef.current = null;
    };
  }, []);

  // pick best available mimeType for MediaRecorder
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported
  const pickMimeType = () => {
    if (window.MediaRecorder?.isTypeSupported?.('video/webm;codecs=vp9'))
      return 'video/webm;codecs=vp9';
    if (window.MediaRecorder?.isTypeSupported?.('video/webm;codecs=vp8'))
      return 'video/webm;codecs=vp8';
    if (window.MediaRecorder?.isTypeSupported?.('video/webm')) return 'video/webm';
    return '';
  };

  // start the countdown, then recording
  const prepareRecording = () => {
    if (!canvasRef?.current) return;

    onBeginRecording?.();

    setCountdown(prepSeconds);
    setIsRecording(false);
    setTimeLeft(0);

    // clear any existing countdown
    clearInterval(prepTimerIdRef.current);

    prepTimerIdRef.current = setInterval(() => {
      setCountdown((c) => {
        const next = c <= 1 ? 0 : c - 1;
        if (c <= 1) {
          clearInterval(prepTimerIdRef.current);
          startRecording();
        }
        return next;
      });
    }, 1000);
  };

  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas?.captureStream) return;

    const canvasStream = canvas.captureStream(30);
    canvasStreamRef.current = canvasStream;

    const mimeType = pickMimeType();

    try {
      chunksRef.current = [];
      const mr = new MediaRecorder(canvasStream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);

        onPlaybackReady?.(url);
        setIsRecording(false);
        setTimeLeft(0);
        clearInterval(recordTimerIdRef.current);

        canvasStreamRef.current?.getTracks().forEach((t) => t.stop());
        canvasStreamRef.current = null;
      };

      setIsRecording(true);
      setTimeLeft(recordSeconds);
      setCountdown(0);
      mr.start();

      clearInterval(recordTimerIdRef.current);

      recordTimerIdRef.current = setInterval(() => {
        setTimeLeft((t) => {
          const next = t > 0 ? t - 1 : 0;
          return next;
        });
      }, 1000);

      // cancel timeout if set
      clearTimeout(autoStopTimerIdRef.current);

      // timeout ref stops the recording after N seconds
      autoStopTimerIdRef.current = setTimeout(() => {
        if (mr.state !== 'inactive') mr.stop();
      }, recordSeconds * 1000);
    } catch (err) {
      console.error('MediaRecorder error:', err);
      setIsRecording(false);
      setTimeLeft(0);
      setCountdown(0);
    }
  };

  const stopRecordingEarly = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') mr.stop();
  };

  return (
    <>
      {/* Controls */}
      <div className="d-flex flex-wrap align-items-center gap-2">
        <div className="input-group input-group-sm w-auto">
          <span className="input-group-text">Countdown</span>
          <input
            type="number"
            min={0}
            max={10}
            step={1}
            className="form-control text-end"
            value={prepSeconds}
            onChange={(e) => setPrepSeconds(Math.min(10, Math.max(0, Number(e.target.value) || 0)))}
            disabled={isRecording || countdown > 0}
            style={{ width: 60 }}
            aria-label="Countdown seconds"
          />
          <span className="input-group-text">seconds</span>
        </div>

        <div className="input-group input-group-sm w-auto">
          <span className="input-group-text">Record for</span>
          <input
            type="number"
            min={1}
            max={60}
            step={1}
            className="form-control text-end"
            value={recordSeconds}
            onChange={(e) =>
              setRecordSeconds(Math.min(60, Math.max(1, Number(e.target.value) || 10)))
            }
            disabled={isRecording || countdown > 0}
            style={{ width: 60 }}
            aria-label="Recording duration seconds"
          />
          <span className="input-group-text">seconds</span>
        </div>

        <button
          onClick={prepareRecording}
          disabled={isRecording || countdown > 0}
          className="btn btn-success btn-sm"
        >
          {countdown > 0 ? (
            'Get Ready…'
          ) : !isRecording ? (
            <>
              <i className="bi bi-camera-video" aria-hidden="true" />
              <span> Start recording</span>
            </>
          ) : (
            'Recording…'
          )}
        </button>

        <button
          onClick={stopRecordingEarly}
          disabled={!isRecording}
          className="btn btn-danger btn-sm"
        >
          ■ Stop
        </button>
      </div>
    </>
  );
}
