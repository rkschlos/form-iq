import { useEffect, useRef } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs';

let netPromise;

function loadPosenet() {
  if (!netPromise) {
    netPromise = posenet.load();
  }
  return netPromise;
}

export default function PoseCanvas({ width = 640, height = 480, canvasRef, overlay, mode }) {
  const videoRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    let cameraStream;

    const setupCamera = async () => {
      const video = videoRef.current;
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width, height },
        audio: false,
      });
      video.srcObject = cameraStream;
      await new Promise((res) => {
        video.onloadedmetadata = () => {
          video.play();
          res();
        };
      });
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
      return { video, canvas };
    };

    const run = async () => {
      const net = await loadPosenet();
      const { video, canvas } = await setupCamera();

      // Get canvas context
      const ctx = canvas.getContext('2d');

      const drawKeypoints = (keypoints) => {
        const exclude = ['leftEye', 'rightEye'];
        keypoints.forEach((k) => {
          if (k.score > 0.5 && !exclude.includes(k.part)) {
            const { x, y } = k.position;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
          }
        });
      };

      const drawSkeleton = (keypoints) => {
        const pairs = posenet.getAdjacentKeyPoints(keypoints, 0.5);

        //for each pair, draw a line between keypoints
        pairs.forEach(([a, b]) => {
          ctx.beginPath();
          ctx.moveTo(a.position.x, a.position.y);
          ctx.lineTo(b.position.x, b.position.y);
          ctx.lineWidth = 4;
          ctx.strokeStyle = 'cyan';
          ctx.stroke();
        });
      };

      const drawFrame = async () => {
        //get keypoints from video using posenet api estimateSinglePose
        const pose = await net.estimateSinglePose(video);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        drawKeypoints(pose.keypoints);
        drawSkeleton(pose.keypoints);
        animationFrameId = requestAnimationFrame(drawFrame);
      };

      drawFrame();
    };

    run();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current) videoRef.current.srcObject = null;
      cameraStream?.getTracks().forEach((t) => t.stop());
    };
  }, [width, height, canvasRef]);

  const isCountdown = overlay?.countdown > 0;
  const isRecording = !isCountdown && overlay?.isRecording;

  const overlayText = isCountdown
    ? String(overlay.countdown)
    : isRecording
      ? `● Recording… ${overlay?.timeLeft || 0}s`
      : null;

  const overlayStyle = isCountdown
    ? {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 96,
        fontWeight: 700,
        color: 'white',
        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        pointerEvents: 'none',
      }
    : {
        position: 'absolute',
        left: '50%',
        bottom: 12,
        transform: 'translateX(-50%)',
        padding: '6px 12px',
        borderRadius: 9999,
        background: 'rgba(0,0,0,0.55)',
        fontSize: 18,
        fontWeight: 700,
        color: 'white',
        pointerEvents: 'none',
      };

  return (
    <>
      <div style={{ position: 'relative', width, height }}>
        <video
          ref={videoRef}
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0 }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0 }}
        />
        {overlayText && (
          <div style={overlayStyle}>
            {isRecording ? <span style={{ color: 'red', marginRight: 8 }}>●</span> : null}
            {overlayText.replace('● ', '')}
          </div>
        )}
      </div>
    </>
  );
}
