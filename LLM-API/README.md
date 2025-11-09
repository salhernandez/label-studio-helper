## Environment Variables

Create a `.env` file in the `LLM-API` root directory with the following variables:

```
# Label Studio Configuration
LABEL_STUDIO_URL=http://192.168.1.133
LABEL_STUDIO_PORT=8090
LABEL_STUDIO_TOKEN=your_token_here

# AI Processor Configuration
AI_PROCESSOR_URL=http://192.168.1.123
AI_PROCESSOR_PORT=11434

# Server Configuration
PORT=3000
```

## Docker Commands

- Build image
    - `docker build -t llm_api:1.0.1 .`
- Run for production
    - `docker run --name llm_api_prod -d -p 3000:3000 --env-file .env llm_api:1.0.1`
- Run in dev mode
    - `docker run -it --rm -p 3000:3000 -v "$(pwd)/app":/app -v /app/node_modules --env-file .env llm_api:1.0.1`