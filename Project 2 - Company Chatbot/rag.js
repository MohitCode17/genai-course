/**
 * Implementation Plan
 * Stage 1: Indexing
 * 1. Load the document - pdf, text
 * 2. Chunk the Document
 * 3. Generate vector embedding
 * 4. Store the vector embedding - Vector database
 *
 * State 2: Using the chatbot
 * 1. Setup LLM
 * 2. Add retrieval step
 * 3. Pass input + relevant information to LLM
 */

import { indexTheDocument } from "./prepare.js";

const filePath = "./cg-internal-docs.pdf";

indexTheDocument(filePath);
