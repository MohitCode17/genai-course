import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

// INITIALIZE OLLAMA EMBEDDINGS
const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
});

const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY!,
});

const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

export const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex,
  maxConcurrency: 5,
});

export async function indexTheDocument(filePath: string) {
  const loader = new PDFLoader(filePath, { splitPages: false });
  const doc = await loader.load();

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const texts = await textSplitter.splitText(doc[0].pageContent);

  const documents = texts.map((chunk) => {
    return {
      pageContent: chunk,
      metadata: doc[0].metadata,
    };
  });

  await vectorStore.addDocuments(documents);

  console.log("Done");
}

// indexTheDocument("../cg-knowledge-base.pdf");
