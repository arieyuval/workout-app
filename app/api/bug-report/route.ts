import { NextRequest, NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME;

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
      console.error('Missing GitHub configuration environment variables');
      return NextResponse.json(
        { error: 'Bug reporting is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { platform, subject, description } = body;

    // Validate required fields
    if (!platform || !subject || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the issue body with formatted content
    const issueBody = `## Bug Report

**Platform:** ${platform}

**Description:**
${description}

---
*Submitted via in-app bug report*`;

    // Create GitHub issue using REST API
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          title: `[${platform}] ${subject}`,
          body: issueBody,
          labels: ['bug', `platform:${platform.toLowerCase()}`],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GitHub API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create issue on GitHub' },
        { status: response.status }
      );
    }

    const issue = await response.json();

    return NextResponse.json({
      success: true,
      issueNumber: issue.number,
      issueUrl: issue.html_url,
    });
  } catch (error) {
    console.error('Error in POST /api/bug-report:', error);
    return NextResponse.json(
      { error: 'Failed to submit bug report' },
      { status: 500 }
    );
  }
}
