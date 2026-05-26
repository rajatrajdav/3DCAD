// 3DCAD.jsx
// Backward compatibility wrapper — all UI/logic lives in CADEditor.jsx
// This file simply re-exports CADEditor as the default export so any
// existing import of "3DCAD" continues to work without changes.
export { default } from './CADEditor';