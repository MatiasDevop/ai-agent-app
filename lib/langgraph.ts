import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { InMemoryCache } from "@langchain/core/caches"; // Option 1: In-memory cache
import { ToolNode } from "@langchain/langgraph/prebuilt";
import wxflows from "@wxflows/sdk/langchain";

// here you can use any model you want
// import { ChatOpenAI } from '@langchain/openai'
// import { ChatGooglePalm } from '@langchain/google-palm'
// import { ChatAzureOpenAI } from '@langchain/azure-openai'
// import { ChatAnthropic } from '@langchain/anthropic'
const cache = new InMemoryCache();

// Connect to exflows
const toolClient = new wxflows({
  endpoint: process.env.WXFLOW_ENDPOINT || "",
  apikey: process.env.WXFLOW_APIKEY ,
});

// Retrieve the tools from exflows
const tools = await toolClient.lcTools;
const toolNode = new ToolNode(tools);

const initialiseModel = () => {
   console.log("Initialising Hugging Face model with caching...");   
  const model = new HuggingFaceInference({
      model: "meta-llama/Llama-3-8b", // Use LLaMA 3 (8B parameters)
      apiKey: process.env.HUGGINGFACE_API_KEY, // Free Hugging Face API key
      temperature: 0.7, // Adjust the temperature for creativity
        maxTokens: 4096,
      // Add the cache instance here---
      cache: cache,
      callbacks: [
        {
          handleLLMStart: async(token) => {
            // Handle the new token as it is generated
            console.log("Starting LLM generation...");
            console.log("Token:", token);
          },
          handleLLMEnd: async(output) => {
            console.log("END LLM Call");
            const usage = output.llmOutput?.usage;
            if (usage) {
              console.log("Tokens used:", usage.total_tokens);
              console.log("Prompt tokens:", usage.prompt_tokens);
              console.log("Completion tokens:", usage.completion_tokens);
              console.log("Total tokens:", usage.total_tokens);
            }
          },
          handleLLMError(error) {
            console.error("Error:", error);
          }
        }
      ]
    }).bind();
    return model;
  };