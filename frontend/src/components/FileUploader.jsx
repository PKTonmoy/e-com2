import React, { useState, useRef } from 'react';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

const FileUploader = ({
    accept = "image/*",
    maxFiles = 5,
    onUpload,
    label = "Upload Files",
    description = "Drag and drop or click to select"
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState([]);
    const inputRef = useRef(null);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        handleFiles(droppedFiles);
    };

    const handleFiles = (newFiles) => {
        const validFiles = newFiles.slice(0, maxFiles - files.length);
        if (validFiles.length) {
            const updatedFiles = [...files, ...validFiles];
            setFiles(updatedFiles);
            if (onUpload) onUpload(updatedFiles);
        }
    };

    const removeFile = (index) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        if (onUpload) onUpload(updatedFiles);
    };

    return (
        <div className="w-full">
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative group cursor-pointer flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed transition-all duration-300 ${isDragging
                        ? 'border-gold bg-gold/5 scale-[1.01]'
                        : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 hover:border-gold/50 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                    }`}
                role="button"
                tabIndex={0}
                aria-label="Upload file area"
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className={`p-4 rounded-full mb-3 transition-colors ${isDragging ? 'bg-gold/20 text-gold' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 group-hover:text-gold group-hover:bg-gold/10'}`}>
                        <CloudArrowUpIcon className="w-8 h-8" />
                    </div>
                    <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-300 font-medium">
                        <span className="text-gold font-bold hover:underline">Click to upload</span> {description.replace('click to select', '')}
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        SVG, PNG, JPG or GIF (MAX. {maxFiles} files)
                    </p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept={accept}
                    multiple
                    onChange={(e) => handleFiles(Array.from(e.target.files))}
                />
            </div>

            {files.length > 0 && (
                <ul className="mt-4 space-y-2">
                    {files.map((file, index) => (
                        <li key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-white dark:bg-matte border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-neutral-500">
                                    <DocumentIcon className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-neutral-900 dark:text-ivory truncate max-w-[200px]">{file.name}</span>
                                    <span className="text-xs text-neutral-400">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                className="p-1 rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                aria-label="Remove file"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default FileUploader;
