import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { InMemoryCache } from "@langchain/core/caches"; // Option 1: In-memory cache
import { ToolNode } from "@langchain/langgraph/prebuilt";
import wxflows from "@wxflows/sdk/langchain";

import {
  StateGraph,
  END,
  START,
  MessagesAnnotation,
  MemorySaver,
} from "@langchain/langgraph";
import SYSTEM_MESSAGE from "@/constants/systemMessage";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  trimMessages,
} from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

// here you can use any model you want
// import { ChatOpenAI } from '@langchain/openai'
// import { ChatGooglePalm } from '@langchain/google-palm'
// import { ChatAzureOpenAI } from '@langchain/azure-openai'
// import { ChatAnthropic } from '@langchain/anthropic'

//Customers at : https://introspection.apis.stepzen.com/customers
// Comments at: https://dummyjson.com/comments

const trimmer = trimMessages({
  maxTokens: 10,
  strategy: "last",
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial: false,
  startOn: "human",
});

const cache = new InMemoryCache();

// Connect to exflows
const toolClient = new wxflows({
  endpoint: process.env.WXFLOW_ENDPOINT || "",
  apikey: process.env.WXFLOW_APIKEY,
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
        handleLLMStart: async (token) => {
          // Handle the new token as it is generated
          console.log("Starting LLM generation...");
          console.log("Token:", token);
        },
        handleLLMEnd: async (output) => {
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
        },
      },
    ],
  }).bind(toolNode); // Bind the tool node to the model

  return model;
};
// Define the function tha determines whether to continue or not
function shouldContinue(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the LLM makes a tool call, then we route to the  "tool" node
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }

  // If the last message is a tool message, route back to the "agent" node
  if (lastMessage.content && lastMessage._getType() === "tool") {
    return "agent";
  }

  // Otherwise, we stop  (reply to the user)
  return END;
}

// Create a workflow using the model and tools
const createWorkflow = async () => {
  const model = await initialiseModel();
  const stateGraph = new StateGraph(MessagesAnnotation, {
    /* Add any necessary configuration options here */
  })
    .addNode("agent", async (state) => {
      // Create the system message content
      const systemContent = SYSTEM_MESSAGE;

      // Create the prompt with the system message and messages placeholder
      const promptTemplate = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemContent, {
          cache_control: { type: "ephemeral" },
        }),
        new MessagesPlaceholder("messages"),
      ]);

      // Trim the messages to manage conversation history
      const trimmedMessages = await trimmer.invoke(state.messages);

      // Format the prompt with the current messages
      const prompt = await promptTemplate.invoke({
        messages: trimmedMessages,
      });

      // Get a response from the model
      const response = await model.invoke(prompt);
      return { messages: response };
    })
    .addEdge(START, "agent")
    .addNode("tool", toolNode)
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tool", "agent");

  return stateGraph;
};

function addCachingHeader(messages: BaseMessage[]): BaseMessage[] {
  // Rules of caching headers for turn-by-turn conversations
  // 1.Cache the first SYSTEM message
  // 2.Cache the last message
  // 3.Cache the second to last HUMAN message

  if (!messages.length) return messages;
  // Create a copy of messages to avoid mutating the original
  const cachedMessages = [...messages];

  // Helper to add cache control
  const addCache = (messages: BaseMessage) =>{
    messages.content = [
      {
        type: "text",
        text: messages.content as string,
        cache_control: {
          type: "ephemeral",
        },
      }
    ]
  };

  //Cache the last message
  // Console.log("🤑🤑🤑 Caching Last message");
  addCache(cachedMessages.at(-1)!);

  // Find and cache the second -to-last HUMAN message
  let humanCount = 0;
  for (let i = cachedMessages.length - 1; i >= 0; i--) {
    if(cachedMessages[i] instanceof HumanMessage){
      humanCount++;
      if (humanCount === 2) {
        // Cache this message
        // Console.log("🤑🤑🤑 Caching Second to last HUMAN message");
        addCache(cachedMessages[i]);
        break;
      }
    }
  }
  return cachedMessages;
}

export async function submitQuestion(messages: BaseMessage[], chatId: string) {
  // Add caching headers to the messages
  const cachedMessages = addCachingHeader(messages);
  console.log("🔒🔒🔒 Messages:", cachedMessages);
  // Create the workflow
  const workflow = await createWorkflow();
  // Create checkpoint to save the state of the conversation
  const checkpointer = new MemorySaver();
  const app = workflow.compile({ checkpointer });

  // Run the graph and stream
  const stream = await app.streamEvents(
    {
      messages: cachedMessages,
    },
    {
      version: "v2",
      configurable: {
        thread_id: chatId,
      },
      streamMode: "messages",
      runId: chatId,
    }
  );
  return stream;
}
