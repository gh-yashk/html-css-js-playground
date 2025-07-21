import css_icon from "@/assets/css.svg";
import html_icon from "@/assets/html.svg";
import js_icon from "@/assets/javascript.svg";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useCodeStore } from "@/store/useCodeStore";
import type { File } from "@/types/app";
import Editor from "@monaco-editor/react";
import { Ban, CodeXml, Download, ExternalLink, Eye, Plus, RotateCcw, Terminal } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const files: File[] = [
    { filetype: "html", icon: html_icon, filename: "index.html" },
    { filetype: "css", icon: css_icon, filename: "style.css" },
    { filetype: "javascript", icon: js_icon, filename: "script.js" },
];

export default function App() {

    const { code, setCode, resetCode } = useCodeStore();

    const [filetype, setFiletype] = useState(files[0].filetype);

    const [page, setPage] = useState<string | undefined>(undefined);
    const [js, setJs] = useState<string | undefined>(undefined);
    const [consoleOutput, setConsoleOutput] = useState<string>("");

    const consoleRef = useRef<HTMLDivElement>(null);

    const addScript = useCallback(() => {
        setConsoleOutput("");
        const script = `
            window.onerror=function(message,source,lineno,colno,error){
                const error_message='Error: '+message+' at '+source+':'+lineno+':'+colno;
                window.parent.postMessage({type:'console',message:error_message},'*');
            };
            console.log=function(...args){
                window.parent.postMessage({type:'console',message:args.join(' ')},'*')
            };
            try{
                ${js}
            }catch(error){
                const error_message='Error: '+error.message;
                window.parent.postMessage({type:'console',message:error_message},'*');
            };
        `;
        setPage(`<html><head><style>${code.css}</style></head><body>${code.html}<script>${script}</script></body></html>`);
    }, [js]);

    useEffect(() => {
        addScript();
    }, [addScript]);

    useEffect(() => {
        setPage(`<html><head><style>${code.css}</style></head><body>${code.html}</body></html>`);
    }, [code.css, code.html]);

    useEffect(() => {
        const listener = (event: MessageEvent) => {
            if (event.data.type === "console") {
                setConsoleOutput((prev) => (prev ? `${prev}\n${event.data.message}` : event.data.message));
            }
        };

        window.addEventListener("message", listener);
        return () => window.removeEventListener("message", listener);
    }, []);

    useEffect(() => {
        setJs(code.javascript);
    }, []);

    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [consoleOutput]);

    const handlePreview = () => {
        const fullHTML = `<html><head><style>${code.css}</style></head><body>${code.html}<script>${code.javascript}</script></body></html>`;
        const blob = new Blob([fullHTML], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
    };

    const generateExportHTML = (): string => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(code.html, "text/html");

        const title = doc.querySelector("title")?.outerHTML || "<title>My HTML Page</title>";
        const bodyContent = doc.body.innerHTML || code.html;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${title}
    <style>
        ${code.css}
    </style>
</head>
<body>
    ${bodyContent}
    <script>
        ${code.javascript}
    </script>
</body>
</html>`.trim();
    };

    const handleExport = () => {
        const htmlContent = generateExportHTML();
        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "project.html";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className="flex flex-col h-screen w-screen">
                <nav className="h-12 flex items-center justify-between px-4 pl-6">
                    <div className="tracking-widest flex gap-4">
                        <CodeXml className="h-6 text-[#28c244]" />
                        <span>PLAYGROUND</span>
                    </div>
                    <div className="flex gap-8 tracking-widest text-[11px] text-amber-500">
                        <button
                            onClick={handlePreview}
                            className="flex hover:text-[#28c244] items-center gap-1.5 cursor-pointer py-2 px-4"
                        >
                            <span>PREVIEW</span>
                            <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex hover:text-[#28c244] items-center gap-1.5 cursor-pointer py-2 px-4"
                        >
                            <span>EXPORT</span>
                            <Download className="h-4 w-4" />
                        </button>
                        <button
                            onClick={resetCode}
                            className="flex hover:text-[#28c244] items-center gap-1.5 cursor-pointer py-2 px-4"
                        >
                            <span>RESET</span>
                            <RotateCcw className="h-4 w-4" />
                        </button>
                    </div>
                </nav>
                <div className="flex-1 px-2 pb-2">
                    <ResizablePanelGroup direction="horizontal">

                        {/* code editor */}
                        <ResizablePanel defaultSize={50} minSize={40}>

                            <div className="h-full pr-1">
                                <div className="bg-[#1e1e1e] h-full flex flex-col rounded-md">
                                    <div className="h-9 bg-[#262626] shrink-0 rounded-t-md flex items-center px-4 justify-between">
                                        <div className="flex items-center rounded-md gap-0.5">
                                            {files.map((file, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setFiletype(file.filetype)}
                                                    className={`flex gap-0.5 px-2 py-1 rounded-sm cursor-pointer hover:bg-[#2f2f2f] select-none ${file.filetype === filetype ? "bg-[#333]" : ""}`}
                                                >
                                                    <img src={file.icon} alt={file.filetype} className="h-5 w-5" />
                                                    <span className="font-[400] tracking-wide">{file.filename}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={() => setJs(code.javascript)} className="flex items-center gap-0.5 cursor-pointer px-2 py-1 rounded-sm bg-[#2f2f2f] hover:bg-[#333]">
                                            <Plus className="h-3 w-3" />
                                            <span>JS</span>
                                        </button>
                                    </div>
                                    <div className="flex-grow min-h-0 pb-2">
                                        <Editor
                                            key={filetype}
                                            language={filetype}
                                            value={code[filetype]}
                                            onChange={(value) => value !== undefined && setCode(filetype, value)}
                                            theme="vs-dark"
                                            options={{
                                                minimap: { enabled: false },
                                                wordWrap: "on",
                                                tabSize: 4,
                                                insertSpaces: true,
                                                detectIndentation: false,
                                                formatOnPaste: true,
                                                formatOnType: true,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                        </ResizablePanel>

                        <ResizableHandle className="bg-[#0f0f0f] w-[2px] hover:bg-[#1990ff] rounded-md" />

                        <ResizablePanel defaultSize={50} minSize={30}>

                            <ResizablePanelGroup direction="vertical">

                                {/* preview */}
                                <ResizablePanel defaultSize={70}>

                                    <div className="h-full pl-1 pb-1">
                                        <div className="bg-[#1e1e1e] h-full flex flex-col rounded-md">
                                            <div className="h-9 bg-[#262626] shrink-0 rounded-t-md flex items-center px-4 gap-2">
                                                <Eye className="h-5 w-5 text-[#28c244]" />
                                                <span>Preview</span>
                                            </div>
                                            <div className="flex-grow min-h-0">
                                                <iframe className="h-full w-full rounded-b-md" srcDoc={page}></iframe>
                                            </div>
                                        </div>
                                    </div>

                                </ResizablePanel>

                                <ResizableHandle className="bg-[#0f0f0f] !h-[2px] hover:bg-[#1990ff] rounded-md" />

                                {/* console */}
                                <ResizablePanel defaultSize={30} maxSize={60} minSize={10}>

                                    <div className="h-full pl-1 pt-1">
                                        <div className="bg-[#1e1e1e] h-full flex flex-col rounded-md">
                                            <div className="h-9 bg-[#262626] shrink-0 rounded-t-md flex items-center px-4 justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Terminal className="h-5 w-5 text-[#28c244]" />
                                                    <span>Console</span>
                                                </div>
                                                <button onClick={() => setConsoleOutput("")} className="cursor-pointer" title="Clear console">
                                                    <Ban className="h-5 w-5 text-red-500 hover:text-red-700" />
                                                </button>
                                            </div>
                                            <div
                                                ref={consoleRef}
                                                className="flex-1 overflow-y-auto min-h-0 p-2 text-sm text-white font-mono whitespace-pre-wrap custom-scrollbar mb-2"
                                            >
                                                {consoleOutput}
                                            </div>
                                        </div>
                                    </div>

                                </ResizablePanel>

                            </ResizablePanelGroup>

                        </ResizablePanel>

                    </ResizablePanelGroup>
                </div>
            </div>
        </>
    )
}