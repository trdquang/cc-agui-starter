import { config } from "dotenv";
import { ChatbotServer } from "./server.js";

// Load environment variables
config();

async function main() {
  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ Error: OPENAI_API_KEY environment variable is required");
    console.log("Please set your OpenAI API key in the .env file:");
    console.log("OPENAI_API_KEY=your-api-key-here");
    process.exit(1);
  }

  // Create and start server
  const server = new ChatbotServer({
    port: parseInt(process.env.PORT || "3001"),
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
    openaiApiKey: process.env.OPENAI_API_KEY
  });

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🔄 Shutting down server gracefully...");
    await server.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n🔄 Shutting down server gracefully...");
    await server.stop();
    process.exit(0);
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });

  try {
    await server.start();
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Run the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}