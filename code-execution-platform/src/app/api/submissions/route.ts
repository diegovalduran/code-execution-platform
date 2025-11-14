import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all submissions (optionally filtered by status)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const submissions = await prisma.submission.findMany({
      where: status ? { status } : {},
      orderBy: { submittedAt: 'desc' },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
          },
        },
        testResults: true,
      },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// POST create new submission
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { problemId, code, language = 'python', testResults } = body;

    if (!problemId || !code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create submission with test results
    const submission = await prisma.submission.create({
      data: {
        problemId,
        code,
        language,
        status: 'pending',
        testResults: {
          create: testResults?.map((result: any) => ({
            testCaseId: result.testCaseId,
            passed: result.passed,
            actualOutput: result.actualOutput,
            errorMessage: result.errorMessage,
            executionTime: result.executionTime,
          })) || [],
        },
      },
      include: {
        testResults: true,
        problem: {
          select: {
            title: true,
          },
        },
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}

