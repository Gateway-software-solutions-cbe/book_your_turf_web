// // src/components/ExportButton.tsx
// import React, { useState } from 'react';
// import { exportData, ExportFormat } from '../utils/exportUtils';

// interface ExportButtonProps {
//   data: any[];
//   fileName: string;
//   format?: ExportFormat;
//   disabled?: boolean;
//   customFormatters?: Record<string, (value: any, row: any) => any>;
//   onExport?: () => void;
//   buttonText?: string;
//   className?: string;
// }

// const ExportButton: React.FC<ExportButtonProps> = ({
//   data,
//   fileName,
//   format = 'excel',
//   disabled = false,
//   customFormatters,
//   onExport,
//   buttonText = 'Export',
//   className = '',
// }) => {
//   const [isExporting, setIsExporting] = useState(false);

//   const handleExport = () => {
//     if (isExporting || disabled) return;
    
//     setIsExporting(true);
//     try {
//       onExport?.();
//       exportData(data, {
//         fileName,
//         format,
//         sheetName: fileName,
//       });
//     } catch (error) {
//       console.error('Export failed:', error);
//       alert('Failed to export data. Please try again.');
//     } finally {
//       setIsExporting(false);
//     }
//   };

//   return (
//     <div className="dropdown">
//       <button
//         className={`btn btn-outline-success rounded-pill px-3 ${className}`}
//         onClick={handleExport}
//         disabled={disabled || isExporting || data.length === 0}
//         style={{ fontWeight: 500 }}
//       >
//         {isExporting ? (
//           <>
//             <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
//             Exporting...
//           </>
//         ) : (
//           <>
//             <i className="bi bi-download me-1"></i>
//             {buttonText}
//           </>
//         )}
//       </button>
//       <button
//         className="btn btn-outline-success dropdown-toggle dropdown-toggle-split rounded-pill px-2"
//         data-bs-toggle="dropdown"
//         aria-expanded="false"
//         disabled={disabled || isExporting || data.length === 0}
//         style={{ marginLeft: '-5px' }}
//       >
//         <span className="visually-hidden">Toggle Dropdown</span>
//       </button>
//       <ul className="dropdown-menu dropdown-menu-end">
//         <li>
//           <button
//             className="dropdown-item"
//             onClick={() => {
//               handleExport();
//             }}
//           >
//             <i className="bi bi-file-earmark-excel me-2 text-success"></i>
//             Export as Excel (.xlsx)
//           </button>
//         </li>
//         <li>
//           <button
//             className="dropdown-item"
//             onClick={() => {
//               exportData(data, {
//                 fileName,
//                 format: 'csv',
//                 sheetName: fileName,
//               });
//             }}
//           >
//             <i className="bi bi-file-earmark-text me-2 text-primary"></i>
//             Export as CSV (.csv)
//           </button>
//         </li>
//       </ul>
//     </div>
//   );
// };

// export default ExportButton;