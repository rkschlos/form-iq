import React, { useEffect, useRef } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs';

const PoseNetDemo = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let animationFrameId;

    const setupCamera = async () => {
      const video = videoRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve(video);
        };
      });
    };

    function drawKeypoints(keypoints, ctx) {
  const exclude = ['leftEye', 'rightEye'];

  keypoints.forEach((keypoint) => {
    if (keypoint.score > 0.5 && !exclude.includes(keypoint.part)) {
      const { x, y } = keypoint.position;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
    }
  });
}
    function drawSkeleton(keypoints, ctx) {
        const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, 0.5);

        adjacentKeyPoints.forEach(([from, to]) => {
            ctx.beginPath();
            ctx.moveTo(from.position.x, from.position.y);
            ctx.lineTo(to.position.x, to.position.y);
            ctx.lineWidth = 4;          // Thicker line (default is ~2)
            ctx.strokeStyle = 'cyan';   // Change from 'lime' to 'cyan'
            ctx.stroke();
        });
    }

    const runPoseNet = async () => {
      const net = await posenet.load();
      const video = await setupCamera();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const detect = async () => {
        const pose = await net.estimateSinglePose(video, { flipHorizontal: false });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        drawKeypoints(pose.keypoints, ctx);
        drawSkeleton(pose.keypoints, ctx);
        animationFrameId = requestAnimationFrame(detect);
      };

      detect();
    };

    runPoseNet();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '640px', height: '480px' }}>
        <video
            ref={videoRef}
            width="640"
            height="480"
            style={{ position: 'absolute', top: 0, left: 0 }}
            muted
        />
        <canvas
            ref={canvasRef}
            width="640"
            height="480"
            style={{ position: 'absolute', top: 0, left: 0 }}
        />
        </div>
    </div>
    );
};

export default PoseNetDemo;
