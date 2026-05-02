# Sutra Intelligence ⚡

An enterprise-grade Retrieval-Augmented Generation (RAG) platform built to securely connect, parse, and search through corporate knowledge graphs. Sutra allows companies to upload complex documents, process them reliably in the background, and instantly query them via a highly secure, animated web dashboard or through an external embedded chat widget.

![Sutra Intelligence](docs/hero.png)

## 🚀 Features

* **Advanced Document Parsing**: Integrates with [LlamaParse](https://github.com/run-llama/llama_parse) to seamlessly extract high-quality markdown from complex scanned PDFs, tables, and nested documents.
* **Enterprise Role-Based Access Control (RBAC)**: Strict document isolation using Supabase Row Level Security (RLS). Supports 2-Tier access:
  * `Public to Company`: Visible to all members in the workspace.
  * `Private to Me`: Strictly isolated to the uploading user.
* **Background Queue Pipeline**: Built on [Inngest](https://www.inngest.com/) for resilient, non-blocking background jobs (parsing, chunking, and embedding).
* **Lightning Fast Inference**: Powered by Groq's LPU inference engine and the `llama-3.3-70b-versatile` model for sub-second generation.
* **Vector Search**: Utilizes `pgvector` on Supabase with HNSW indexing for rapid semantic retrieval.
* **Embeddable Chat Widget**: Deploy your enterprise chatbot to any external website via a single `<script>` tag.
* **Stunning UI/UX**: Custom deep-dark "Glassmorphism" design system animated beautifully with Framer Motion.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Framer Motion, Lucide Icons
* **Backend**: Next.js Route Handlers
* **Database**: Supabase (PostgreSQL, pgvector)
* **Background Jobs**: Inngest
* **AI & LLMs**: Groq (Llama 3), Google Generative AI (Embeddings)
* **Parsing**: LlamaParse REST API

---

## ⚙️ Local Setup & Installation

### 1. Prerequisites
* Node.js 18+
* A [Supabase](https://supabase.com/) project (with pgvector enabled)
* A [Groq](https://console.groq.com/) API Key
* A [Google Gemini](https://aistudio.google.com/) API Key (for embeddings)
* A [LlamaCloud](https://cloud.llamaindex.ai/) API Key (for LlamaParse)

### 2. Clone and Install
\`\`\`bash
git clone https://github.com/yourusername/sutra-intelligence.git
cd sutra-intelligence
npm install
\`\`\`

### 3. Environment Variables
Create a \`.env\` file in the root directory and add the following keys:

\`\`\`env
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Auth & Database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI & Embeddings
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# Parsing
LLAMAPARSE_API_KEY=your_llamaparse_api_key

# Background Jobs
INNGEST_EVENT_KEY=local
INNGEST_SIGNING_KEY=local
\`\`\`

### 4. Database Setup
Run the SQL migrations located in the \`supabase/\` directory within your Supabase SQL Editor:
1. Run \`schema.sql\` (Core tables & pgvector setup)
2. Run \`enterprise_upgrade.sql\` (Company/User relationships)
3. Run \`rbac_upgrade.sql\` (Document access levels and RLS policies)

### 5. Running the Application

You need two terminals to run the application locally (one for the web server, one for the background queue).

**Terminal 1 (Next.js):**
\`\`\`bash
npm run dev
\`\`\`

**Terminal 2 (Inngest Dev Server):**
\`\`\`bash
npx inngest-cli@latest dev
\`\`\`

Navigate to \`http://localhost:3000\` to access the Sutra dashboard.

---

## 🔌 Embedding the Widget on External Sites

You can embed Sutra into any HTML website, WordPress blog, or web application.

1. Navigate to the **Settings** page in your Sutra dashboard.
2. Copy your **Embed API Key** and the provided `<script>` snippet.
3. Paste the snippet just before the closing \`</body>\` tag of your target website:

\`\`\`html
<script src="https://your-sutra-domain.com/widget.js" data-key="YOUR_EMBED_API_KEY_HERE"></script>
\`\`\`

*Note: Ensure your Sutra backend is actively running, as the widget makes real-time fetch requests to \`/api/embed-chat\`.*

---

## 🛡️ Security & Privacy Architecture

Sutra enforces strict data isolation using **Supabase Row Level Security (RLS)**.

- **Storage Level**: Physical PDF files uploaded by a user are strictly isolated.
- **Database Level**: The \`documents\` table enforces policies that prevent users from seeing documents belonging to other workspaces.
- **Vector Search Level**: The \`match_chunks\` PostgreSQL RPC function takes the authenticated user's ID and access level, ensuring that the semantic search step only scans embeddings the user is explicitly authorized to view.
- **Widget Level**: External widgets operate on an anonymous \`null\` user scope, preventing external users from ever retrieving documents marked as \`Private\`.

---

## 📄 License
MIT License.
