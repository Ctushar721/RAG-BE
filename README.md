# NestJS Backend Server for RAG

A NestJS backend server implementing Retrieval-Augmented Generation (RAG) with file upload and semantic search capabilities.

## Project Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Start the development server:
```bash
npm run start:dev
```

The server will start on http://localhost:3001

## API Endpoints

### 1. File Upload
- **Endpoint**: `POST /files/upload`
- **Description**: Upload multiple files (PDF, TXT, CSV, JSON) for processing
- **Request**: Multipart form data with field name 'files'
- **Example**:
```bash
curl -X POST -F "files=@file1.pdf" -F "files=@file2.txt" http://localhost:3001/files/upload
```

### 2. Semantic Search
- **Endpoint**: `POST /files/search`
- **Description**: Search through uploaded files using natural language queries
- **Request Body**:
```json
{
  "query": "your search query here"
}
```
- **Example**:
```bash
curl -X POST \
  http://localhost:3001/files/search \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "your search query"
  }'
```

## Future Improvements

1. **Enhanced Error Handling**
   - Implement more intuitive error messages
   - Add detailed error logging
   - Provide better error responses with actionable information

2. **Database Integration**
   - Add a traditional database layer (e.g., PostgreSQL)
   - Store file contents and metadata separately from vector database
   - Implement proper data persistence and backup mechanisms

3. **Content Optimization**
   - Implement content summarization to reduce redundancy
   - Add document chunking strategies
   - Optimize context window usage for OpenAI API
