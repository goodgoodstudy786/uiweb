import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import Image from "@editorjs/image";
import Paragraph from "@editorjs/paragraph";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import InlineCode from "@editorjs/inline-code";
import Delimiter from "@editorjs/delimiter";

export type EditorOutput = {
  blocks: Array<{
    type: string;
    data: Record<string, unknown>;
  }>;
};

let editorInstance: EditorJS | null = null;

function sanitizeFileName(fileName: string): string {
  const ext = fileName.split(".").pop() || "png";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `works/${timestamp}_${random}.${ext}`;
}

export async function createEditor(containerId: string, initialData?: EditorOutput, onImageUpload?: (file: File) => Promise<string>): Promise<EditorJS> {
  if (editorInstance) {
    await editorInstance.destroy();
    editorInstance = null;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container #${containerId} not found`);
  }

  editorInstance = new EditorJS({
    holder: containerId,
    data: initialData || { blocks: [] },
    tools: {
      header: {
        class: Header,
        inlineToolbar: true,
        config: {
          placeholder: "标题",
          levels: [2, 3, 4],
          defaultLevel: 2,
        },
      },
      paragraph: {
        class: Paragraph,
        inlineToolbar: true,
      },
      image: {
        class: Image,
        config: {
          uploader: {
            uploadByFile: async (file: File) => {
              if (onImageUpload) {
                const url = await onImageUpload(file);
                return {
                  success: 1,
                  file: { url },
                };
              }
              return { success: 0 };
            },
            uploadByUrl: (url: string) => {
              return Promise.resolve({
                success: 1,
                file: { url },
              });
            },
          },
          captionPlaceholder: "图片描述",
        },
      },
      list: {
        class: List,
        inlineToolbar: true,
      },
      quote: {
        class: Quote,
        inlineToolbar: true,
        config: {
          quotePlaceholder: "引用内容",
          captionPlaceholder: "引用来源",
        },
      },
      marker: Marker,
      inlineCode: InlineCode,
      delimiter: Delimiter,
    },
    placeholder: "开始编辑详情页内容...",
    onChange: () => {
      // 内容变化时的回调
    },
  });

  await editorInstance.isReady;
  return editorInstance;
}

export async function getEditorData(): Promise<EditorOutput | null> {
  if (!editorInstance) return null;
  return await editorInstance.save();
}

export async function destroyEditor(): Promise<void> {
  if (editorInstance) {
    await editorInstance.destroy();
    editorInstance = null;
  }
}
