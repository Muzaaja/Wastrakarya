# WastraMockup

- `Pages/WastraMockup.jsx` resolves the drawing and composites its artwork with the saved cloth color. Pass the resulting canvas to both Three.js and `BatikTryOn`. Keep the drawing recovery and ownership checks shared by all modes.
- `CameraMockup.jsx` mounts `BatikTryOn` after the user selects **Aktifkan Kamera**. Leaving camera mode, stopping it, or navigating away must release the media tracks and trackers, including when camera permission is still pending.
- MediaPipe runs in the browser. Camera access requires HTTPS or localhost, and model weights and WASM load on demand from Google Cloud Storage and jsDelivr. Keep the WASM version in `models.js` aligned with the `@mediapipe/tasks-vision` version locked by `@react-three/drei`. Camera frames and PNG snapshots are processed locally.
- For browser verification, open a saved design and try all three modes. Check the cloth color and motif in the camera preview, change the scale, download a PNG, deny and retry camera access, and switch to a 3D mode while the camera is starting.
