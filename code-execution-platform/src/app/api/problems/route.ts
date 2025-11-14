import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all problems
export async function GET() {
  try {
    const problems = await prisma.problem.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        testCases: true,
        _count: {
          select: { submissions: true }
        }
      }
    });
    return NextResponse.json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    return NextResponse.json(
      { error: 'Failed to fetch problems' },
      { status: 500 }
    );
  }
}

// POST create new problem
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, exampleInput, exampleOutput } = body;

    if (!title || !description || !exampleInput || !exampleOutput) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        exampleInput,
        exampleOutput,
      },
    });

    return NextResponse.json(problem, { status: 201 });
  } catch (error) {
    console.error('Error creating problem:', error);
    return NextResponse.json(
      { error: 'Failed to create problem' },
      { status: 500 }
    );
  }
}

