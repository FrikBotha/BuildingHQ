import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getMaskedSettings, updateSettings, getAnthropicApiKey } from "@/data/settings";

export async function GET() {
  try {
    const settings = await getMaskedSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to load settings:", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "update") {
      const { anthropicApiKey } = body;
      if (typeof anthropicApiKey !== "string") {
        return NextResponse.json(
          { error: "Invalid API key format" },
          { status: 400 }
        );
      }
      await updateSettings({ anthropicApiKey: anthropicApiKey.trim() });
      const masked = await getMaskedSettings();
      return NextResponse.json({
        success: true,
        settings: masked,
      });
    }

    if (body.action === "test_connection") {
      const apiKey = await getAnthropicApiKey();
      if (!apiKey) {
        return NextResponse.json({
          success: false,
          error: "No API key configured. Please save an API key first.",
        });
      }

      try {
        const client = new Anthropic({ apiKey });
        const message = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 32,
          messages: [
            {
              role: "user",
              content: "Reply with only the word: connected",
            },
          ],
        });

        const responseText = message.content
          .filter(
            (block): block is Anthropic.TextBlock => block.type === "text"
          )
          .map((block) => block.text)
          .join("");

        return NextResponse.json({
          success: true,
          message: `Connected successfully. Model: ${message.model}`,
          response: responseText.trim(),
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";

        if (
          errorMessage.includes("401") ||
          errorMessage.includes("authentication") ||
          errorMessage.includes("invalid")
        ) {
          return NextResponse.json({
            success: false,
            error:
              "Authentication failed. Please check that your API key is correct.",
          });
        }

        if (
          errorMessage.includes("429") ||
          errorMessage.includes("rate")
        ) {
          return NextResponse.json({
            success: false,
            error:
              "Rate limited. The API key is valid but you've hit the rate limit. Try again in a moment.",
          });
        }

        if (
          errorMessage.includes("403") ||
          errorMessage.includes("permission")
        ) {
          return NextResponse.json({
            success: false,
            error:
              "Permission denied. Your API key may not have the required permissions.",
          });
        }

        return NextResponse.json({
          success: false,
          error: `Connection failed: ${errorMessage}`,
        });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Settings API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
