@echo off
REM Set environment variables
set ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic
set ANTHROPIC_AUTH_TOKEN=bc6bec7741a04923981ceb4341ff9e8b.DmKeFEPzpxapYf3T

REM Run claude command
@REM npx claude --dangerously-skip-permissions
npx claude --dangerously-skip-permissions
