import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST create new test case
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { problemId, input, expectedOutput } = body;

    if (!problemId || !input || !expectedOutput) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const testCase = await prisma.testCase.create({
      data: {
        problemId,
        input,
        expectedOutput,
      },
    });

    return NextResponse.json(testCase, { status: 201 });
  } catch (error) {
    console.error('Error creating test case:', error);
    return NextResponse.json(
      { error: 'Failed to create test case' },
      { status: 500 }
    );
  }
}

