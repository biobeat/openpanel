-- Custom context the AI assistant reads at the start of every chat.
ALTER TABLE "projects" ADD COLUMN "aiAssistantContext" TEXT;
