import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import { submitQuestion } from "@/lib/langgraph";
import {
  ChatRequestBody,
  SSE_DATA_PREFIX,
  SSE_LINE_DELIMITER,
  StreamMessage,
  StreamMessageType,
} from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { NextResponse } from "next/server";

function sendSSEMessage(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  data: StreamMessage
) {
  const encoder = new TextEncoder();

  return writer.write(
    encoder.encode(
      `${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`
    )
  );
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }
    const body = (await req.json()) as ChatRequestBody;
    const { messages, newMessage, chatId } = body;

    const convex = getConvexClient();

    // Create stream with larger queue strategy for better performance
    const stream = new TransformStream({}, { highWaterMark: 1024 });
    const writer = stream.writable.getWriter();

    const response = new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no", // Disable buffering for Nginx which is required for SSE to work properly
      },
    });

    const startStream = async () => {
      try {
        // Start will be implemented here

        // Send initial connection established message
        await sendSSEMessage(writer, {
          type: StreamMessageType.Connected,
        });

        // Send user message to Convex
        await convex.mutation(api.messages.create, {
          chatId,
          content: newMessage,
        });

        // Convert messages to LangChain format
        const langChainMessages = [
          ...messages.map((msg) =>
            msg.role === "user"
              ? new HumanMessage(msg.content)
              : new AIMessage(msg.content)
          ),
          new HumanMessage(newMessage),
        ];

        try {
          // Create the event stream
          const eventStream = await submitQuestion(langChainMessages, chatId);

          // Process the events
          for await (const event of eventStream) {
            // console.log("Event:", event);
            if(event.event === "on_chat_model_stream"){
              const token = event.data.chunk;
              if(token){
                //access the text property from the AIMessageChunk
                const text = token.content.at(0)?.["text"];
                
                if(text){
                  // Send the token to the client
                  await sendSSEMessage(writer, {
                    type: StreamMessageType.Token,
                    token: text,
                  });
                }
              }

            } else if(event.event === "on_tool_start"){
              await sendSSEMessage(writer, {
                type: StreamMessageType.ToolStart,
                tool: event.name || "unknown",
                input: event.data.input,
              });

            } else if(event.event === "on_tool_end"){
              const toolMessage = new ToolMessage(event.data.output);

              await sendSSEMessage(writer, {
                type: StreamMessageType.ToolEnd,
                tool: toolMessage.lc_kwargs.name || "unknown",
                output: event.data.output,
              });
            }

            // Send completion message without storing the response
            await sendSSEMessage(writer, { type: StreamMessageType.Done });
          }

        } catch (streamError) {
          console.error("Error in event stream:", streamError);
          await sendSSEMessage(writer, {
            type: StreamMessageType.Error,
            error:
              streamError instanceof Error
                ? streamError.message
                : "Stream processing failed",
          });
        }
      } catch (error) {
        console.error("Error in Stream:", error);
        await sendSSEMessage(writer, {
          type: StreamMessageType.Error,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error occurred",
        });
      }
    };

    startStream();

    return response;
  } catch (error) {
    console.error("Error in /api/chat/stream:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." } as const,
      { status: 500 }
    );
  }
}
